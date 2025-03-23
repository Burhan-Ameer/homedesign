import os
import requests
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from homebase.models import Products, images as Images  # Alias the images model as Images
from django.core.files.base import ContentFile
import io
from django.core.files.uploadedfile import InMemoryUploadedFile
from PIL import Image
import mimetypes
from homebase.models import Colors

def createpost(request):
    if request.method == "POST":
        title = request.POST.get("title")
        content = request.POST.get("content")
        categories = request.POST.get("category")
        images_files = request.FILES.getlist("images")  # Get multiple files
        color=request.POST.get("colors")
        # Validate required fields
        if not title or not content:
            messages.error(request, "Title and Content are required")
            return render(request, "createpost.html")
        
        # Create and save product
        product = Products(
            admin=request.user,
            name=title,
            description=content,
            categories=categories,
        )
        product.save()
        
        # Handle multiple images
        for image_file in images_files:
            try:
                # Save original image
                image_instance = Images.objects.create(
                    product=product,
                    image=image_file  # Save original image
                )

                # Save colors
                if color:
                    # Split the colors by commas (assuming the user enters colors as a comma-separated string)
                    color_list = color.split(",")
                    for color_name in color_list:
                        color_name = color_name.strip()  # Remove extra spaces
                        if color_name:  # Ensure the color is not empty
                            Colors.objects.create(
                                product=product,
                                color=color_name
                            )

                # Background removal API call
                url = "https://remove-background18.p.rapidapi.com/public/remove-background"
                headers = {
                    "x-rapidapi-key": "3fcc31d69fmshb83cffade800382p1b301ejsne2771f99ccbc",
                    "x-rapidapi-host": "remove-background18.p.rapidapi.com",
                    "accept": "application/json"
                }
                files = {"file": image_file}

                # Make API request
                response = requests.post(url, headers=headers, files=files)

                if response.status_code == 200:
                    # Parse the JSON response to get the image URL
                    response_json = response.json()
                    image_url = response_json.get("url")

                    if image_url:
                        # Download the background-removed image
                        image_response = requests.get(image_url)
                        if (image_response.status_code == 200):
                            # Save background-removed image
                            image_instance.bg_removed_image.save(
                                f"nobg_{image_file.name}",
                                ContentFile(image_response.content),
                                save=True
                            )
                            print(f"Background removed image saved: nobg_{image_file.name}")
                        else:
                            print(f"Failed to download the background-removed image. Status code: {image_response.status_code}")
                    else:
                        print("No image URL found in the response.")
                else:
                    print(f"Error: {response.status_code}, {response.text}")

            except Exception as e:
                print(f"Error processing image {image_file.name}: {str(e)}")
                messages.error(request, f"Error processing image {image_file.name}: {str(e)}")

        # Success message after processing all images
        messages.success(request, "Product Created Successfully!")
        return redirect("adminpage")
    
    return render(request, "createpost.html")

def deletepost(request, pk):
    product = get_object_or_404(Products, pk=pk)
    product.delete()
    messages.success(request, "Product deleted successfully!")
    return redirect("adminpage")

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
            user.Bio = bio

        user.save()
        messages.success(request, "Profile updated successfully!")
        return redirect("admin_profile")

    return render(request, "Edit_profile.html", {"user": user})

def explore(request):
    return render(request, "Explore.html")

def product_detail(request, pk):
    product = get_object_or_404(Products, pk=pk)
    product_images = Images.objects.filter(product=product)
    color=Colors.objects.filter(product=product)
    return render(request, 'detailed_post.html', {
        'product': product,
        'images': product_images,   
        "colors":color
    })

def adminpage(request):
    products = Products.objects.filter(admin=request.user)
    product_images = images.objects.filter(product__in=products)
    
    context = {
        "products": products,
        "images": product_images,
        "total_products": products.count()
    }
    
    return render(request, "adminpage.html", context)