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
    Bio=models.CharField(max_length=1000 ,null=True,blank=True)
    # the wesite name is for admin not the user 
    website=models.CharField(max_length=300, null=True, blank=True)
    # location of headquarter
    location=models.CharField(max_length=300 ,null=True,blank=True)

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
    def is_user(self):
        return self.role == "customer"

    def is_Admin(self):
        return self.role == "business"    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'