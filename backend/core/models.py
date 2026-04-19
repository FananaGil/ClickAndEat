"""
Base models for CLICK&EAT project.
"""

from django.db import models
from django.utils import timezone


class SoftDeleteManager(models.Manager):
    """
    Manager that filters out soft-deleted objects.
    """
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

    def all_with_deleted(self):
        """Return all objects including soft-deleted ones."""
        return super().get_queryset()

    def deleted(self):
        """Return only soft-deleted objects."""
        return super().get_queryset().filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    """
    Abstract base model that provides soft delete functionality.
    Objects are not actually deleted from the database, but marked with deleted_at timestamp.
    """
    deleted_at = models.DateTimeField(null=True, blank=True, editable=False)
    is_deleted = models.BooleanField(default=False, editable=False)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        """
        Soft delete the object by setting deleted_at timestamp.
        """
        self.deleted_at = timezone.now()
        self.is_deleted = True
        self.save(using=using, update_fields=['deleted_at', 'is_deleted'])

    def restore(self):
        """
        Restore a soft-deleted object.
        """
        self.deleted_at = None
        self.is_deleted = False
        self.save(update_fields=['deleted_at', 'is_deleted'])

    def hard_delete(self):
        """
        Permanently delete the object from the database.
        """
        super().delete(using=using, keep_parents=keep_parents)


class TimestampedModel(models.Model):
    """
    Abstract base model that provides auto-generated created_at and updated_at timestamps.
    """
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True
