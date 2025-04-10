from django.shortcuts import render, get_object_or_404
from homeusers.models import CustomUser
from django.core.paginator import Paginator
from django.db.models import Q
from homebase.models import Products,images as Images

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