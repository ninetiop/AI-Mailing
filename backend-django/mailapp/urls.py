from django.urls import path
from rest_framework.documentation import include_docs_urls
from .views import SendEmailView, TestSMTPView, MailboxView, TemplateAPIView, CampaignView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.urls import path, re_path

schema_view = get_schema_view(
   openapi.Info(
      title="Ma Super API",
      default_version='v1',
      description="Documentation interactive de l'API",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('send/', SendEmailView.as_view(), name='send-email'),  # /mail (envoie d'email)
    path('testsmtp/', TestSMTPView.as_view(), name='test-smtp'),  # /testsmtp (test de connexion SMTP)
    re_path(r'^templates(?:/(?P<template_id>\d+))?/?$', TemplateAPIView.as_view(), name='templates'),
    re_path(r'^campaigns(?:/(?P<campaign_id>\d+))?/?$', CampaignView.as_view(), name='campaigns'),
    path('mailbox/', MailboxView.as_view(), name='mailbox'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # tu pourras ajouter les autres routes ici au fur et à mesure
]
