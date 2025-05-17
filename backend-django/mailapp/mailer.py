import smtplib
import uuid
import logging
import re
#from pydantic import BaseModel
from rest_framework import serializers
from email.utils import formataddr, formatdate
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bs4 import BeautifulSoup
from django.conf import settings
from .exceptions import SMTPAuthentificationException, RemoteServerSMTPException, SendMailException

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Affiche les logs sur la console
        logging.FileHandler(str(settings.FILE_LOG), mode="a")  # Sauvegarde les logs dans un fichier
    ]
)
logger = logging.getLogger(__name__)

class AuthentificationSMTPSerializer(serializers.Serializer):
    smtp_server = serializers.CharField()
    smtp_port = serializers.IntegerField()
    is_tls = serializers.BooleanField()
    smtp_user = serializers.CharField()
    smtp_passwd = serializers.CharField()
    

class EmailObjSerializer(serializers.Serializer):
    smtp_auth = AuthentificationSMTPSerializer()
    recipient = serializers.EmailField()
    sender = serializers.CharField()
    subject = serializers.CharField()
    body = serializers.CharField()


class Mailer:
    def __init__(self):
        pass

    def _format(self):
        pass

    def _is_html(self, body: str) -> bool:
        # Vérifie si le texte contient des balises HTML
        return bool(re.search(r'<.*?>', body))  # Recherche des balises HTML simples

    def _convert_html_to_text(self, html: str) -> str:
        # Utilise BeautifulSoup pour convertir le HTML en texte brut
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text()  # Récupère tout le texte sans balises HTML

    def test_connection(self, email_auth: AuthentificationSMTPSerializer):
        try:
            remote_conn = False
            # Utilisation de validated_data pour accéder aux données validées
            email_data = email_auth.validated_data  # Accéder aux données validées
            
            with smtplib.SMTP(email_data['smtp_server'], email_data['smtp_port']) as server:
                remote_conn = True
                if email_data['is_tls']:  # Vérifier si TLS est activé
                    server.starttls()
                server.login(email_data['smtp_user'], email_data['smtp_passwd'])
        except Exception as exc:
            if remote_conn:
                logger.error(f"Failed authentication to server {email_data['smtp_server']} on port {email_data['smtp_port']} for reason: {exc}")
                raise SMTPAuthentificationException
            else:
                logger.error(f"Failed connection to server {email_data['smtp_server']} on port {email_data['smtp_port']} for reason: {exc}")
                raise RemoteServerSMTPException

    def send_mail(self, email_obj: EmailObjSerializer):
        smtp_server = email_obj['smtp_auth']['smtp_server']
        smtp_port = email_obj['smtp_auth']['smtp_port']
        username_mail = email_obj['smtp_auth']['smtp_user']
        password_mail = email_obj['smtp_auth']['smtp_passwd']
        sender_name = email_obj['sender']
        recipient_mail = email_obj['recipient']
        subject = email_obj['subject']
        body = email_obj['body']

        # Création du message avec plusieurs parties (HTML et texte brut)
        message = MIMEMultipart("alternative")  # Spécifie qu'il peut y avoir plusieurs formats

        try:
            # Définir les entêtes de l'email
            message["From"] = formataddr((sender_name, username_mail))
            message["To"] = recipient_mail
            message["Subject"] = subject
            message["Date"] = formatdate(localtime=True)
            message["Message-ID"] = f"<{str(uuid.uuid4())}@{smtp_server}>"

            # Ajouter la version HTML ou texte brut selon le cas
            if self._is_html(body):
                # Si le corps est du HTML, ajouter le contenu HTML
                message.attach(MIMEText(body, "html"))  # Version HTML
                #text_body = self._convert_html_to_text(body)  # Convertir le HTML en texte brut
                #message.attach(MIMEText(text_body, "plain"))  # Ajouter aussi la version texte brut
            else:
                # Si le corps est du texte brut, on l'ajoute directement
                message.attach(MIMEText(body, "plain"))

            # Envoi de l'email via le serveur SMTP
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()  # Sécurisation de la connexion avec TLS
                server.login(username_mail, password_mail)  # Connexion au serveur SMTP
                server.send_message(message)  # Envoyer le message
                logger.info(f"Email sent successfully: {email_obj}")

        except Exception as exc:
            logger.error(f"Failed to send mail for reason: {exc}")
            raise SendMailException