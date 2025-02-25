from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class CustomUser(AbstractUser):
    RoleChoices = (
        ("customer", "Customer Account"),
        ("business", "Business Account")
    )
    role = models.CharField(max_length=20, choices=RoleChoices, default="customer")
    profile_pic = models.ImageField(
        upload_to="profile_pics/",
        null=True,
        blank=True,
        default="profile_pics/default.png"
    )
    
    # Add related_name to resolve conflicts
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',  # Changed related_name
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',  # Changed related_name
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    def is_admin(self):
        return self.role == "admin"
    
    def is_user(self):
        return self.role == "user"
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'