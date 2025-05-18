from django.db import models
from homeusers.models import CustomUser
from django.utils import timezone
import cloudinary
import cloudinary.uploader
from cloudinary.models import CloudinaryField


class Products(models.Model):
    Categories_choice=(
    ("kitchen","kitchen"),
    ("office","office"),
    ("living room","living room"),
    ("dining  room","dining room" )
    )
    categories=models.CharField( max_length=20,choices=Categories_choice,default="living room")
    admin=models.ForeignKey(CustomUser,on_delete=models.CASCADE,limit_choices_to={"role":"business"},null=True)
    name=models.CharField(max_length=1000,null=False,blank=False)
    description=models.TextField(blank=True,null=True)
    created_date=models.DateTimeField(default=timezone.now)
    likes=models.ManyToManyField(CustomUser,related_name="likes",blank=True)
    
    @property
    def likes_count(self):
        return self.likes.count()
        
    def __str__(self):
        return self.name
    class  Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
    # the number of like color images can be multiple thats why i need to create a many to many relationship between the products and the likes and the colors and the images


class Colors(models.Model):
    product=models.ForeignKey(Products,on_delete=models.CASCADE)
    color=models.CharField(max_length=100)
    class Meta:
        verbose_name = 'Color'
        verbose_name_plural = 'Colors'
    def __str__(self):
        return f"{self.product.name} color {self.color}" 
        # for multiple images because we dont want to show single image that's why
           
class images(models.Model):
    product = models.ForeignKey(Products, on_delete=models.CASCADE,related_name="images")

    # Original image
    image = CloudinaryField(
        'image',
        folder='product_images/original_product',
        null=True,
        blank=True
    )
    
    # Background removed image
    bg_removed_image = CloudinaryField(
        'image',
        folder='product_images/bg_removed',
    )
    uploaded_at = models.DateTimeField(
        default=timezone.now,  # Set default value
        editable=False  # Make it non-editable
    )
    class Meta:
        verbose_name = 'Image'
        verbose_name_plural = 'Images'
    def __str__(self):
        return f"{self.product.name} image {self.image}"