from django.shortcuts import render, redirect
from homeusers.models import CustomUser
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from homebase.models import Products,images ,Colors

# Custom decorators 
def is_customer(user):
    return user.is_authenticated and user.role == "customer"

def is_business(user):
    return user.is_authenticated and user.role == "business"

# View decorators
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
def home(request):
    return render(request, "home.html")

@login_required(login_url='login')
@user_passes_test(is_business, login_url='login')
def adminpage(request):
    product=Products.objects.filter(admin=request.user)
    image=images.objects.filter(product__in=product)
    total_posts=product.count()
    if not request.user.is_authenticated:
        messages.error(request, "Please login first")
        return redirect('login')
    return render(request, "adminpage.html",{"products":product,"total_products":total_posts,"images":image})

def CreatePost(request):
    return render(request,"createpost.html")
def aboutus(request):
    return render(request,"Aboutus.html")
