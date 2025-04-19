from django.db import models
from homeusers.models import CustomUser
from homebase.models import Products 
# Create your models here.
class Collections(models.Model):
    user= models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    product=models.ForeignKey(Products, on_delete=models.CASCADE)
    date_added=models.DateTimeField(auto_now_add=True)
    class Meta:
        verbose_name = 'Collection'
        verbose_name_plural = 'Collections'
    def __str__(self):
        return f"collection of  {self.user.username}"