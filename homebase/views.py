import requests
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from homebase.models import Products
from django.core.files.base import ContentFile
import os
from homeusers.models import CustomUser

def is_jpeg(image):
    ext = os.path.splitext(image.name)[1].lower()
    return ext in [".jpeg", ".jpg", ".webp"]  # Check if file extension is jpg, jpeg, or webp

# Post creation view
def createpost(request):
    if request.method == "POST":
        title = request.POST.get("title")
        content = request.POST.get("content")
        categories = request.POST.get("category")
        image_1 = request.FILES.get("image1")
        color = request.POST.get("color")
        
        # Just to check if the form is not empty
        if not title or not content:
            messages.error(request, "Title and Content are required")
            return render(request, "createpost.html")

        if image_1 and not is_jpeg(image_1):
            messages.error(request, "Please upload only JPEG, JPG, or WEBP images")
            return render(request, "createpost.html")
        
        # Saving the product information without bg removed
        product = Products(
            admin=request.user,
            name=title,
            description=content,
            image=image_1,
            categories=categories,
            color=color
        )
        product.save()

        response = requests.post(
            'https://api.remove.bg/v1.0/removebg',
            files={'image_file': image_1},
            data={'size': 'auto'},
            headers={'X-Api-Key': 'a9zYMHSpRhTgkeRYstbfEjN6'},
        )
        if response.status_code == 200:
            # Convert response content to image file
            image_content = ContentFile(response.content)
            product.image_2d.save(
                f"{product.name}_2d.png",
                image_content,
                save=False
            )
        else:
            messages.error(request, "Error occurred, please try again")
        
        product.save()
        messages.success(request, "Product Created Successfully!")
        return redirect("some_view_name")  # Replace with the actual view name you want to redirect to

    return render(request, "createpost.html")

def deleteposts(request, pk):
    product = get_object_or_404(Products, pk=pk)
    product.delete()
    messages.success(request, "Product deleted successfully!")
    return redirect("some_view_name")  # Replace with the actual view name you want to redirect to

def Profile(request):
    return render(request, "admin_profile.html")

def edit_profile(request):
    user = request.user
    if request.method == "POST":
        profile_pic = request.FILES.get("profile_pic")
        email = request.POST.get("email")
        website = request.POST.get("website")
        location = request.POST.get("location")
        bio = request.POST.get("bio")
        
        if email:
            user.email = email
        if profile_pic:
            user.profile_pic = profile_pic
        if website:
            user.website = website
        if location:
            user.location = location
        if bio:
            user.bio = bio
        
        user.save()
        messages.success(request, "Profile updated successfully!")
        return redirect("profile")  # Redirect to profile page
    
    return render(request, "Edit_profile.html", {"user": user})

def explore(request):
    return render(request, "Explore.html")

def product_detail(request, pk):
    product = get_object_or_404(Products, pk=pk)
    return render(request, 'detailed_post.html', {'product': product})