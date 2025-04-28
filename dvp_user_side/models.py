from django.db import models
from homeusers.models import CustomUser
from homebase.models import Products 
from django.contrib.auth import get_user_model
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

class Feedback(models.Model):
    FEEDBACK_TYPES = [
        ('bug',     'Bug Report'),
        ('feature', 'Feature Request'),
        ('general', 'General Feedback'),
    ]

    user          = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)
    feedback_type = models.CharField(max_length=10, choices=FEEDBACK_TYPES)
    subject       = models.CharField(max_length=200)
    message       = models.TextField()
    created_at    = models.DateTimeField(auto_now_add=True)
    status        = models.CharField(
                      max_length=20,
                      choices=[('open','Open'),('in_progress','In Progress'),('resolved','Resolved')],
                      default='open'
                   )

    def __str__(self):
        return f"{self.get_feedback_type_display()} – {self.subject}"