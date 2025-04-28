from django.shortcuts import render, get_object_or_404
from homeusers.models import CustomUser
from django.core.paginator import Paginator
from django.db.models import Q
from homebase.models import Products,images as Images
from django.contrib import messages
from .models import Collections
from django.http import HttpResponseRedirect
def brands(request):
    query = request.GET.get("search")
    if query:
        business_users = CustomUser.objects.filter(
            Q(username__icontains=query, role="business")   
        ).order_by("username")
    else:
        business_users = CustomUser.objects.filter(role="business")
    context = {
        'business_users': business_users,
    }
    return render(request, "brands.html", context)

def brand_details(request, username):
    # Get business user and their products
    business_user = get_object_or_404(CustomUser, username=username, role="business")
    products_list = Products.objects.filter(admin=business_user)
    
    # Paginate products
    paginator = Paginator(products_list, 8)
    page_number = request.GET.get('page', 1)  # Added default page
    products = paginator.get_page(page_number)
    
    # Get images for current page products only
    current_products = list(products)
    images = Images.objects.filter(
        product__in=current_products
    ).select_related('product')  # Added select_related for optimization
    
    context = {
        'business_user': business_user,
        'products': products,
        'images': images,
    }
    return render(request, "brand_product_details.html", context)

# canvas view
def canvas(request):
    return render(request, "canvas.html")
# COLLECTION VIEW
def add_to_collection(request,product_id):
    product = get_object_or_404(Products, id=product_id)
    existing_collection = Collections.objects.filter(user=request.user, product=product).first()
    if existing_collection:
        messages.error(request, "Product already in your collection.")
    else:
        Collections.objects.create(user=request.user, product=product)
        messages.success(request, "Product added to your collection.")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))
def collections(request):
    collections_qs = Collections.objects.filter(user=request.user)
    products = Products.objects.filter(collections__in=collections_qs).distinct()

    # build a map { product_id: first Image instance }
    product_images = {}
    for img in Images.objects.filter(product__in=products).order_by('product_id','id'):
        if img.product_id not in product_images:
            product_images[img.product_id] = img

    # attach first image to each product
    for p in products:
        p.first_image = product_images.get(p.id)

    context = {
        'collections': collections_qs,
        'products': products,
        'product_images': product_images,
    }
    return render(request, "collections.html", context)

def products(request):
    query = request.GET.get("search")
    if query:
        products_list = Products.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        ).order_by("name")
    else:
        products_list = Products.objects.all()
    
    # Paginate products
    paginator = Paginator(products_list, 8)
    page_number = request.GET.get('page', 1)  # Added default page
    products = paginator.get_page(page_number)
    
    # Get images for current page products only
    current_products = list(products)
    images = Images.objects.filter(
        product__in=current_products
    ).select_related('product')  # Added select_related for optimization
    
    context = {
        'products': products,
        'images': images,
    }
    return render(request, "products.html", context)

def remove_from_collection(request, product_id):
    """Remove one product from user’s collection."""
    Collections.objects.filter(user=request.user, product_id=product_id).delete()
    messages.success(request, "Item removed from your collection.")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/collections/'))

def clear_collection(request):
    """Clear all items from user’s collection."""
    Collections.objects.filter(user=request.user).delete()
    messages.success(request, "All items cleared from your collection.")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/collections/'))