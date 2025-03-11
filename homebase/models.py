from django.db import models
from homeusers.models import CustomUser
from django.utils import timezone
# Create your models here.
class Products(models.Model):
    admin=models.ForeignKey(CustomUser,on_delete=models.CASCADE,limit_choices_to={"role":"business"},null=True)
    name=models.CharField(max_length=1000,null=False,blank=False)
    description=models.TextField(blank=True,null=True)
    image=models.ImageField(upload_to="product_images",blank=True,null=True
    ,default="default/default.jpg")
    image_2d=models.ImageField(upload_to="2D_images",blank=True, null=True,default="default/default.png")
    created_date=models.DateTimeField(default=timezone.now)
    def __str__(self):
        return self.name
    class  Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
    
class Likes(models.Model):
    products=models.ForeignKey(Products,related_name="likes",on_delete=models.CASCADE)
    no_of_likes=models.PositiveIntegerField(default=0)