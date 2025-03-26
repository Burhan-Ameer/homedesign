from django.shortcuts import render, redirect
from homeusers.models import CustomUser
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from homebase.models import Products,images as Images ,Colors
from django.core.paginator import Paginator

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
    # Fetch products for the logged-in admin
    products = Products.objects.filter(admin=request.user)
    images = Images.objects.filter(product__in=products)
    total_posts = products.count()

    # Add pagination
    paginator = Paginator(products, 10)  # Show 10 products per page
    page_number = request.GET.get('page')  # Get the current page number from the query string
    page_obj = paginator.get_page(page_number)  # Get the products for the current page

    # Pass the paginated products to the template
    context = {
        "products": page_obj,  # Use the paginated products
        "total_products": total_posts,
        "images": images,
    }
    return render(request, "adminpage.html", context)

def CreatePost(request):
    return render(request,"createpost.html")
def aboutus(request):
    return render(request,"Aboutus.html")
