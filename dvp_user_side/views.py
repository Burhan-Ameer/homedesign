from django.shortcuts import render, get_object_or_404
from homeusers.models import CustomUser
from django.core.paginator import Paginator
from django.db.models import Q
from homebase.models import Products,images as Images
from django.contrib import messages
from .models import Collections
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
 # Adjust import to match your actual model names

def is_customer(user):
    return user.is_authenticated and user.role == "customer"

def is_business(user):
    return user.is_authenticated and user.role == "business"
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
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
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
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
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
def canvas(request):
    """
    View for rendering the canvas page with products from either user's collection or all products
    """
    # Check if we should show all products or just collection
    show_all = request.GET.get('show_all', '0') == '1'
    
    # Get search query from request
    search_query = request.GET.get('search', '')
    
    products_with_images = []
    
    if show_all:
        # Show all products logic
        if search_query:
            # If search query provided, filter all products
            products_list = Products.objects.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query)
            ).order_by("name")
        else:
            products_list = Products.objects.all().order_by("name")
    else:
        # Show collection only logic
        user_collections = Collections.objects.filter(user=request.user)
        collection_products = [collection.product for collection in user_collections]
        
        if search_query:
            # Filter collection products
            filtered_products = []
            for product in collection_products:
                if (search_query.lower() in product.name.lower() or 
                    (product.description and search_query.lower() in product.description.lower())):
                    filtered_products.append(product)
            products_list = filtered_products
        else:
            products_list = collection_products
    
    # For each product, get its first image
    for product in products_list:
        # Get first image for this product
        images = Images.objects.filter(product=product)
        if images.exists():
            # Add product and its image to our list
            products_with_images.append({
                'product': product,
                'image': images.first()
            })
    
    # Pass data to template
    context = {
        'products_with_images': products_with_images,
        'search_query': search_query,  # Pass search query back to template
        'show_all': show_all,  # Flag to indicate what we're showing
    }
    
    return render(request, 'canvas.html', context)

# COLLECTION VIEW
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
def add_to_collection(request,product_id):
    product = get_object_or_404(Products, id=product_id)
    existing_collection = Collections.objects.filter(user=request.user, product=product).first()
    if existing_collection:
        messages.error(request, "Product already in your collection.")
    else:
        Collections.objects.create(user=request.user, product=product)
        messages.success(request, "Product added to your collection.")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))
    
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
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
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
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
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
def remove_from_collection(request, product_id):
    """Remove one product from user’s collection."""
    Collections.objects.filter(user=request.user, product_id=product_id).delete()
    messages.success(request, "Item removed from your collection.")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/collections/'))
@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')   
def clear_collection(request):
    """Clear all items from user’s collection."""
    Collections.objects.filter(user=request.user).delete()
    messages.success(request, "All items cleared from your collection.")
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/collections/'))

@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
def toggle_like(request, product_id):
    """Toggle like status for a product"""
    product = get_object_or_404(Products, id=product_id)
    
    # Check if user already liked this product
    if request.user in product.likes.all():
        # Unlike
        product.likes.remove(request.user)
        liked = False
    else:
        # Like
        product.likes.add(request.user)
        liked = True
    
    # For AJAX requests, return JSON response
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({
            'liked': liked,
            'count': product.likes.count()
        })
    
    # For regular requests, redirect back to referring page
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))