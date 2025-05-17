from django.db import models
from django.core.validators import EmailValidator, RegexValidator
from django.utils.timezone import now

class CampaignMail(models.Model):
    """
    Modèle représentant une campagne email
    """
    name = models.CharField(
        max_length=255,
        verbose_name="Nom de la campagne",
        help_text="Donnez un nom descriptif à votre campagne"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )
    
    class Meta:
        verbose_name = "Campagne Email"
        verbose_name_plural = "Campagnes Emails"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} (ID: {self.id})"
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_at': self.created_at.isoformat(),
        }

class Mail(models.Model):
    """
    Modèle représentant un email cible dans une campagne
    """
    campaign = models.ForeignKey(
        CampaignMail,
        on_delete=models.CASCADE,
        related_name='mails',
        verbose_name="Campagne associée"
    )
    
    email = models.EmailField(
        max_length=255,
        verbose_name="Adresse email",
        validators=[
            EmailValidator(),
            RegexValidator(
                regex=r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$',
                message="Format d'email invalide"
            )
        ]
    )
    
    added_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'ajout"
    )
    

    class Meta:
        verbose_name = "Email Cible"
        verbose_name_plural = "Emails Cibles"
        unique_together = ('campaign', 'email')
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.email} (Campagne: {self.campaign.name})"
    
    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign.id,
            'campaign_name': self.campaign.name,
            'email': self.email,
            'added_at': self.added_at.isoformat(),
        }

class Template(models.Model):
    template_name = models.CharField(max_length=255)
    date_ts = models.DateTimeField(auto_now_add=True)
    sender = models.EmailField()
    subject = models.CharField(max_length=255)
    from_email = models.EmailField(null=True, blank=True)
    body = models.TextField()

    class Meta:
        ordering = ['-date_ts']
    
    def __str__(self):
        return self.template_name
    
    def to_dict(self):
        return {
            'id': self.id,
            'template_name': self.template_name,
            'date_ts': self.date_ts.isoformat(),
            'sender': self.sender,
            'subject': self.subject,
            'from_email': self.from_email or '',
            'body': self.body,
            'body_preview': self.body[:100] + '...' if len(self.body) > 100 else self.body
        }

    def to_compact_dict(self):
        """Version allégée pour les listes"""
        return {
            'id': self.id,
            'template_name': self.template_name,
            'subject': self.subject,
            'modified': self.date_ts.strftime("%Y-%m-%d")
        }