from django.utils        import timezone
from dvp_user_side.models import Feedback
from django.shortcuts import render, redirect
from homeusers.models import CustomUser
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from homebase.models import Products,images as Images ,Colors
from django.core.paginator import Paginator
from django.db.models import Q

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
    # Get the search query from the request
    query = request.GET.get("search", "")

    # If a search query is provided, filter products based on the query
    if query:
        products = Products.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query),
            admin=request.user
        ).order_by("name")  # Ensure consistent ordering
    else:
        # Otherwise, fetch all products for the logged-in admin
        products = Products.objects.filter(admin=request.user).order_by("name")

    # Add pagination
    paginator = Paginator(products, 10)  # Show 10 products per page
    page_number = request.GET.get("page")  # Get the current page number from the query string
    page_object = paginator.get_page(page_number)  # Get the products for the current page

    # Fetch images for the products on the current page
    images = Images.objects.filter(product__in=page_object)

    # Pass data to the template
    context = {
        "products": page_object,
        "images": images,           
        "query": query,  # Pass the search query to the template
    }
    return render(request, "adminpage.html", context)


def aboutus(request):
    return render(request,"Aboutus.html")
def pricing(request):
    return render(request,"pricing.html")
    

    
def feedback(request):
    # Stats
    stats = {
        'resolved':    Feedback.objects.filter(status='resolved').count(),
        'in_progress': Feedback.objects.filter(status='in_progress').count(),
        'new_ideas':   Feedback.objects.filter(status='open', feedback_type='general').count(),
    }
    # History
    history = Feedback.objects.filter(user=request.user).order_by('-created_at')

    if request.method == 'POST':
        ftype   = request.POST.get('feedback_type')
        subject = request.POST.get('subject','').strip()
        message = request.POST.get('message','').strip()

        if not (ftype and subject and message):
            messages.error(request, "Please fill in all required fields.")
        else:
            fb = Feedback(
                user=request.user,
                feedback_type=ftype,
                subject=subject,
                message=message,
                created_at=timezone.now()
            )
            fb.save()
            messages.success(request, "Thank you for your feedback!")
            return redirect('feedback')

    return render(request, "feedback.html", {
        'stats':   stats,
        'history': history,
    })