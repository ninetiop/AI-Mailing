# views.py
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from .mailer import Mailer, EmailObjSerializer, AuthentificationSMTPSerializer
from .exceptions import SMTPAuthentificationException, RemoteServerSMTPException, SendMailException
from .dbservice import DBService
from .models import Template, Mail, CampaignMail
from django.db import transaction  # Pour les transactions atomiques
from imaplib import IMAP4, IMAP4_SSL
import email
from email.header import decode_header

class MailboxView(APIView):
    def get(self, request, *args, **kwargs):
        """Récupère les emails depuis le serveur IMAP distant"""
        try:
            # Récupérer les paramètres de configuration IMAP depuis la requête
            imap_config = {
                'imap_server': request.GET.get('imap_server'),
                'imap_port': int(request.GET.get('imap_port')),
                'username': request.GET.get('username'),
                'password': request.GET.get('password'),
                'use_ssl': request.GET.get('use_ssl', 'true').lower() == 'true'
            }

            # Valider que tous les paramètres requis sont présents
            required_params = ['imap_server', 'imap_port', 'username', 'password']
            if not all(imap_config.get(param) for param in required_params):
                return Response({
                    'error': 'Missing required IMAP parameters'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Connexion au serveur IMAP
            if imap_config['use_ssl']:
                imap_server = IMAP4_SSL(imap_config['imap_server'], imap_config['imap_port'])
            else:
                imap_server = IMAP4(imap_config['imap_server'], imap_config['imap_port'])

            # Login
            imap_server.login(imap_config['username'], imap_config['password'])

            # Sélectionner la boîte de réception
            imap_server.select('INBOX')

            # Rechercher tous les emails
            _, message_numbers = imap_server.search(None, 'ALL')
            
            # Limiter à 50 emails les plus récents pour éviter une surcharge
            email_ids = message_numbers[0].split()[-50:]
            
            emails = []
            for email_id in email_ids:
                _, msg_data = imap_server.fetch(email_id, '(RFC822)')
                email_body = msg_data[0][1]
                message = email.message_from_bytes(email_body)

                # Décoder le sujet
                subject = decode_header(message["subject"])[0]
                subject = subject[0] if isinstance(subject[0], str) else subject[0].decode()

                # Décoder l'expéditeur
                from_header = decode_header(message["from"])[0]
                sender = from_header[0] if isinstance(from_header[0], str) else from_header[0].decode()

                # Récupérer la date
                date = message["date"]

                # Récupérer le corps du message
                body = ""
                if message.is_multipart():
                    for part in message.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode()
                            break
                else:
                    body = message.get_payload(decode=True).decode()

                emails.append({
                    'id': email_id.decode(),
                    'subject': subject,
                    'sender': sender,
                    'date': date,
                    'body': body
                })

            # Fermer proprement la connexion
            imap_server.close()
            imap_server.logout()

            return Response({
                'emails': emails
            }, status=status.HTTP_200_OK)

        except IMAP4.error as e:
            logging.error(f"IMAP error: {str(e)}")
            return Response({
                'error': 'IMAP connection failed',
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logging.error(f"Unexpected error in MailboxView: {str(e)}")
            return Response({
                'error': 'Failed to fetch emails',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CampaignView(APIView):
    def get(self, request, campaign_id=None, *args, **kwargs):
        """Récupère une ou toutes les campagnes avec leurs emails"""
        try:
            if campaign_id:
                # Récupérer une campagne spécifique avec ses emails
                campaign = CampaignMail.objects.get(id=campaign_id)
                emails = campaign.mail_set.values_list('email', flat=True)  # Récupère tous les emails de la campagne
                
                return Response({
                    'campaign': {
                        'id': campaign.id,
                        'name': campaign.name,
                        'created_at': campaign.created_at,
                        'targets': list(emails)  # Conversion en liste
                    }
                }, status=status.HTTP_200_OK)
            else:
                # Récupérer toutes les campagnes avec le compte d'emails
                campaigns = CampaignMail.objects.all().prefetch_related('mails')
                
                if not campaigns.exists():  # Vérifie s'il y a des campagnes
                    logging.info("Aucune campagne trouvée dans la base de données")
                    return Response({
                        'campaigns': [],
                        'message': 'Aucune campagne disponible'
                    }, status=status.HTTP_200_OK)
                
                campaigns_data = []
                
                for campaign in campaigns:
                    campaigns_data.append({
                        'id': campaign.id,
                        'name': campaign.name,
                        'created_at': campaign.created_at.isoformat(),
                        'emails': [mail.to_dict() for mail in campaign.mails.all()]  # Sérialisation explicite
                    })
                logging.info(f"Retrieved {len(campaigns_data)} campaign(s)")
                return Response({'campaigns': campaigns_data}, status=status.HTTP_200_OK)
                
        except CampaignMail.DoesNotExist:
            return Response(
                {'detail': 'Campagne non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as exc:
            logging.error(f"Erreur lors de la récupération: {exc}", exc_info=True)
            return Response(
                {'detail': 'Erreur serveur'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic  # Garantit que tout est créé ou rien en cas d'erreur
    def post(self, request, *args, **kwargs):
        """Crée une nouvelle campagne avec ses emails"""
        try:
            data = request.data
            
            # Validation des données
            if not data.get('name'):
                raise ValueError("Le nom de la campagne est obligatoire")
            
            if not isinstance(data.get('emails', []), list):
                raise ValueError("Les targets doivent être une liste d'emails")
            
            # Création de la campagne
            campaign = CampaignMail.objects.create(name=data['name'])
            
            # Préparation des emails uniques et valides
            unique_emails = {email.strip() for email in data['emails'] if email.strip()}
            
            # Création des emails en masse (plus efficace)
            Mail.objects.bulk_create([
                Mail(campaign=campaign, email=email)
                for email in unique_emails
            ])
            
            # Réponse avec les données créées
            return Response({
                'id': campaign.id,
                'name': campaign.name,
                'created_at': campaign.created_at,
                'emails': unique_emails
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as ve:
            return Response(
                {'detail': str(ve)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as exc:
            logging.error(f"Erreur création campagne: {exc}", exc_info=True)
            return Response(
                {'detail': 'Erreur lors de la création'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic
    def put(self, request, *args, **kwargs):
        """
        Met à jour un target existant.
        """
        try:
            campaign_id = kwargs.get('campaign_id') 
            if campaign_id:
                data = request.data
                campaign_updated = {
                    'name': data['name']
                }
                updated_campaign = DBService.update(CampaignMail, campaign_id, campaign_updated)  # Met à jour le target
                old_emails = [mail.email for mail in DBService.get_by_field(Mail, 'campaign_id', campaign_id)]
                mails_to_add = list(set(data['emails']) - set(old_emails))
                mails_to_delete = list(set(old_emails) - set(data['emails']))
                if mails_to_delete:
                    Mail.objects.filter(email__in=[Mail(email=mail, campaign=updated_campaign) for mail in mails_to_delete]).delete()
                if mails_to_add:
                    Mail.objects.bulk_create([Mail(email=mail, ) for mail in mails_to_add])
                logging.info(f"Campaign updated successfully with id {campaign_id}")
                return Response({'message': 'Campaign updated successfully', 'target': updated_campaign.to_dict()}, status=status.HTTP_200_OK)
        except Exception as exc:
            logging.error(f"Exception on /targets/update endpoint for reason: {exc}")
            return Response({'detail': 'Failed to update target'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, campaign_id, *args, **kwargs):
        """
        Supprime un target.
        """
        try:
            campaign_id = int(campaign_id)
            campaign_deleted = DBService.delete(CampaignMail, campaign_id)  # Supprime le target
            logging.info(f"Campaign removed successfully with id {campaign_id}")
            campaign_deleted = campaign_deleted.to_dict()
            campaign_deleted['id'] = campaign_id
            return Response({'message': 'Campaign removed successfully', 'target': campaign_deleted}, status=status.HTTP_200_OK)
        except Exception as exc:
            logging.error(f"Exception on /targets/remove endpoint for reason: {exc}")
            return Response({'detail': 'Failed to remove target'}, status=status.HTTP_400_BAD_REQUEST)

class TemplateAPIView(APIView):
    
    def get(self, request, template_id=None, *args, **kwargs):
        """
        Récupère un ou tous les templates.
        Si template_key est fourni, on récupère un template spécifique.
        """
        try:
            if template_id:
                # Si un template_key est fourni, récupérer un seul template
                template = DBService.get_by_key(Template, template_id)  # Service pour récupérer un template par clé
                return Response({
                    'template': template.to_dict()  # Transforme l'objet en dict pour la réponse
                }, status=status.HTTP_200_OK)
            else:
                # Sinon, récupérer tous les templates
                templates = DBService.get_all(Template)
                templates_data = [{
                    'id': template.id,  # Assurez-vous d'inclure un champ `key` unique pour chaque template
                    'template_name': template.template_name,
                    'date_ts': template.date_ts,  # Si tu veux inclure la date de création, par exemple
                    'sender': template.sender,
                    'subject': template.subject,
                    'from_email': template.from_email,
                    'body': template.body
                } for template in templates]
                logging.info(f"Retrieve {len(templates_data)} template(s)")
                return Response({'templates': templates_data}, status=status.HTTP_200_OK)
        except Exception as exc:
            logging.error(f"Exception on /templates endpoint for reason: {exc}")
            return Response({
                "message": "Bad request",
                "reason": "An error occurred in code, please contact owner of the code"
            }, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, *args, **kwargs):
        """
        Crée un nouveau template.
        """
        try:
            data = request.data
            template_data = {
                'template_name': data['template_name'],
                'sender': data['sender'],
                'subject': data['subject'],
                'from_email': data.get('from_email', ''),
                'body': data['body'],
                'date_ts': datetime.now().strftime("%Y-%m-%d %H:%M:%S")            
            }
            new_template = DBService.create(Template, template_data)  # Crée le template
            logging.info(f"Template created successfully {new_template}")
            return Response({'message': 'Template created successfully', 'template': new_template.to_dict()}, status=status.HTTP_201_CREATED)
        except Exception as exc:
            logging.error(f"Exception on /templates/create endpoint for reason: {exc}")
            return Response({'detail': 'Failed to create template'}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, template_id, *args, **kwargs):
        """
        Met à jour un template existant.
        """
        try:
            data = request.data
            updated_template_data = {
                'template_name': data['template_name'],
                'sender': data['sender'],
                'subject': data['subject'],
                'from_email': data.get('from_email', ''),
                'body': data['body']
            }
            updated_template = DBService.update(Template, template_id, updated_template_data)  # Met à jour le template
            logging.info(f"Template updated successfully with id {template_id}")
            return Response({'message': 'Template updated successfully',  'template': updated_template.to_dict()}, status=status.HTTP_200_OK)
        except Exception as exc:
            logging.error(f"Exception on /templates/update endpoint for reason: {exc}")
            return Response({'detail': 'Failed to update template'}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, template_id, *args, **kwargs):
        """
        Supprime un template.
        """
        try:
            template_id = int(template_id)
            template_deleted = DBService.delete(Template, template_id)  # Supprime le template
            logging.info(f"Template removed successfully with id {template_id}")
            template_dict = template_deleted.to_dict()
            template_dict['id'] = template_id
            return Response({'message': 'Template removed successfully', 'template': template_dict}, status=status.HTTP_200_OK)
        except Exception as exc:
            logging.error(f"Exception on /templates/remove endpoint for reason: {exc}")
            return Response({'detail': 'Failed to remove template'}, status=status.HTTP_400_BAD_REQUEST)


class SendEmailView(APIView):
    def post(self, request):
        try:
            # Sérialisation des données reçues dans la requête
            serializer = EmailObjSerializer(data=request.data)
            if serializer.is_valid():  # Vérification que les données sont valides
                data = serializer.validated_data
                mailer = Mailer()  # Initialisation de l'objet Mailer avec la config
                # Essayer d'envoyer l'email
                mailer.send_mail(email_obj=data)
                # Si tout va bien, retourner un ack=True
                return Response({"ack": True}, status=status.HTTP_200_OK)
            
            # ❗ Si on est ici, c'est que les données sont invalides
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except SendMailException as exc:
            # Gérer l'exception SendMailException
            logging.error(f"Exception on /mail/send endpoint for reason: {exc}")
            return Response(
                {
                    "message": "Bad request",
                    "reason": "Bad format"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as exc:
            # Gérer toute autre exception générique
            logging.error(f"Exception on /mail/send endpoint for reason: {exc}")
            return Response(
                {
                    "message": "Bad request",
                    "reason": "An error occurred in code, please contact owner of the code"
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class TestSMTPView(APIView):
    def post(self, request):
        try:
            # Sérialisation des données reçues dans la requête pour la configuration SMTP
            serializer = AuthentificationSMTPSerializer(data=request.data)
            if serializer.is_valid():  # Vérification que les données sont valides
                mailer = Mailer()  # Initialisation de l'objet Mailer avec la configuration
                
                # Tester la connexion SMTP avec les données validées
                mailer.test_connection(serializer)
                
                # Si la connexion est réussie, retourner un message d'acknowledgement
                return Response({"ack": True}, status=status.HTTP_200_OK)
            
            # Si la sérialisation échoue, retourner les erreurs du serializer
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except RemoteServerSMTPException as exc:
            # Gestion de l'erreur de connexion au serveur SMTP (problème de domaine/port)
            logging.error(f"Exception on /mail/test-smtp endpoint for reason: {exc}")
            return Response(
                {
                    "message": "Bad request",
                    "reason": "Bad SMTP server configuration (domain/port)"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except SMTPAuthentificationException as exc:
            # Gestion de l'erreur d'authentification SMTP (problème de nom d'utilisateur/mot de passe)
            logging.error(f"Exception on /mail/test-smtp endpoint for reason: {exc}")
            return Response(
                {
                    "message": "Bad request",
                    "reason": "Bad authentication username/password"
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except Exception as exc:
            # Gestion des erreurs génériques
            logging.error(f"Exception on /mail/test-smtp endpoint for reason: {exc}")
            return Response(
                {
                    "message": "Bad request",
                    "reason": "An error occurred in code, please contact the owner of the code"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

