from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from typing import Type, TypeVar, List, Dict, Any

# Type générique pour accepter n'importe quel modèle Django
T = TypeVar('T', bound=models.Model)

class DBService:
    """
    Service générique pour gérer les opérations CRUD (Create, Read, Update, Delete)
    pour n'importe quel modèle Django, et ce de manière flexible et générique.
    """

    @staticmethod
    def create(model: Type[T], data: Dict[str, Any]) -> T:
        """
        Crée un nouvel objet dans la base de données.

        :param model: Le modèle Django pour lequel on effectue l'action.
        :param data: Un dictionnaire contenant les données à insérer.
        :return: L'instance de l'objet créé.
        """
        try:
            instance = model.objects.create(**data)  # Crée l'instance en utilisant les données
            return instance
        except Exception as exc:
            raise Exception(f"Erreur lors de la création de {model.__name__}: {exc}")

    @staticmethod
    def update(model: Type[T], instance_id: int, data: Dict[str, Any]) -> T:
        """
        Met à jour un objet existant dans la base de données.

        :param model: Le modèle Django pour lequel on effectue l'action.
        :param instance_id: L'ID de l'instance à mettre à jour.
        :param data: Un dictionnaire contenant les données à mettre à jour.
        :return: L'instance mise à jour.
        """
        try:
            instance = model.objects.get(id=instance_id)  # Récupère l'instance par son ID
            for key, value in data.items():
                setattr(instance, key, value)  # Met à jour chaque champ
            instance.save()  # Sauvegarde l'instance modifiée
            return instance
        except ObjectDoesNotExist:
            raise Exception(f"{model.__name__} avec l'ID {instance_id} non trouvé.")
        except Exception as exc:
            raise Exception(f"Erreur lors de la mise à jour de {model.__name__}: {exc}")

    @staticmethod
    def delete(model: Type[T], instance_id: int) -> T:
        """
        Supprime un objet existant de la base de données.

        :param model: Le modèle Django pour lequel on effectue l'action.
        :param instance_id: L'ID de l'instance à supprimer.
        """
        try:
            instance = model.objects.get(id=instance_id)  # Récupère l'instance par son ID
            instance.delete()  # Supprime l'instance de la base de données
            return instance
        except ObjectDoesNotExist:
            raise Exception(f"{model.__name__} avec l'ID {instance_id} non trouvé.")
        except Exception as exc:
            raise Exception(f"Erreur lors de la suppression de {model.__name__}: {exc}")

    @staticmethod
    def get_all(model: Type[T]) -> List[T]:
        """
        Récupère tous les objets d'un modèle donné.

        :param model: Le modèle Django pour lequel on effectue l'action.
        :return: Liste des objets du modèle.
        """
        try:
            return model.objects.all()  # Retourne tous les objets du modèle
        except Exception as exc:
            raise Exception(f"Erreur lors de la récupération des objets {model.__name__}: {exc}")

    @staticmethod
    def get_by_id(model: Type[T], instance_id: int) -> T:
        """
        Récupère un objet par son ID.

        :param model: Le modèle Django pour lequel on effectue l'action.
        :param instance_id: L'ID de l'instance à récupérer.
        :return: L'instance du modèle.
        """
        try:
            return model.objects.get(id=instance_id)  # Récupère l'instance par son ID
        except ObjectDoesNotExist:
            raise Exception(f"{model.__name__} avec l'ID {instance_id} non trouvé.")
        except Exception as exc:
            raise Exception(f"Erreur lors de la récupération de {model.__name__}: {exc}")

    @staticmethod
    def get_by_field(model: Type[T], field_name: str, value: Any) -> List[T]:
        """
        Récupère un ou plusieurs objets en fonction d'un champ spécifique.

        :param model: Le modèle Django pour lequel on effectue l'action.
        :param field_name: Le nom du champ à filtrer.
        :param value: La valeur que doit avoir ce champ.
        :return: Liste des objets trouvés.
        """
        try:
            return model.objects.filter(**{field_name: value})  # Filtrage dynamique
        except Exception as exc:
            raise Exception(f"Erreur lors de la recherche par {field_name} dans {model.__name__}: {exc}")
