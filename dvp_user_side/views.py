from django.shortcuts import render, get_object_or_404
from homeusers.models import CustomUser
from django.core.paginator import Paginator
from django.db.models import Q
from homebase.models import Products,images as Images
from django.contrib import messages
from .models import Collections, RoomDesign
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.csrf import csrf_exempt
import json

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
    - When show_all=1: Show ALL products (optionally filtered by search)
    - When show_all=0: Show only the user's collection (optionally filtered by search)
    """
    search_query = request.GET.get('search', '').strip()
    show_all = request.GET.get('show_all', '1') == '1'
    design_id = request.GET.get('designId', '')

    products_with_images = []

    if show_all:
        products_list = Products.objects.all()
        if search_query:
            products_list = products_list.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
        products_list = products_list.order_by("name")
    else:
        user_collections = Collections.objects.filter(user=request.user)
        products_list = Products.objects.filter(collections__in=user_collections)
        if search_query:
            products_list = products_list.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
        products_list = products_list.distinct().order_by("name")

    images_map = {
        img.product_id: img
        for img in Images.objects.filter(product__in=products_list).order_by('product_id', 'id')
    }
    for product in products_list:
        img = images_map.get(product.id)
        if img:
            products_with_images.append({
                'product': product,
                'image': img,
                'image_url': img.bg_removed_image.url
            })

    context = {
        'products_with_images': products_with_images,
        'search_query': search_query,
        'show_all': show_all,
        'design_id': design_id,
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

@login_required(login_url='login')
@user_passes_test(is_customer, login_url='login')
def saved_designs(request):
    designs = RoomDesign.objects.filter(user=request.user).order_by('-updated_at')
    return render(request, 'saved_designs.html', {'designs': designs})

@login_required(login_url='login')
def load_design(request, design_id):
    design = get_object_or_404(RoomDesign, id=design_id, user=request.user)
    return render(request, 'canvas.html', {'design': design})

@csrf_exempt  # Note: Better to use proper CSRF protection in production
@login_required(login_url='login')
def save_design(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Create or update design
            design_id = data.get('designId')
            if design_id and design_id.isdigit():
                # Update existing design
                design = RoomDesign.objects.filter(id=design_id, user=request.user).first()
                if not design:
                    return JsonResponse({'success': False, 'error': 'Design not found'}, status=404)
            else:
                # Create new design
                design = RoomDesign(user=request.user)
            
            # Update fields
            design.name = data.get('name', 'Untitled Design')
            design.stage_data = data.get('stageData')
            design.thumbnail = data.get('thumbnailUrl', '')
            design.item_count = data.get('itemCount', 0)
            design.save()
            
            return JsonResponse({
                'success': True, 
                'designId': design.id,
                'message': 'Design saved successfully'
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=405)

@login_required
def get_design(request, design_id):
    """API endpoint to get a specific design"""
    try:
        # Handle both numeric IDs and "canvas_design_X" format
        if isinstance(design_id, str) and design_id.startswith('canvas_design_'):
            # Extract the numeric part
            numeric_id = design_id.replace('canvas_design_', '')
            try:
                numeric_id = int(numeric_id)
            except ValueError:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid design ID format'
                }, status=400)
        else:
            numeric_id = design_id
        
        design = get_object_or_404(RoomDesign, id=numeric_id, user=request.user)
        
        return JsonResponse({
            'success': True,
            'design': {
                'id': design.id,
                'name': design.name,
                'stageData': design.stage_data,
                'thumbnailUrl': design.thumbnail,
                'timestamp': design.created_at.isoformat(),
                'itemCount': design.item_count
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)