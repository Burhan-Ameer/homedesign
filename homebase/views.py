import os
import requests
from django.contrib import messages
from django.shortcuts import render, redirect, get_object_or_404
from homebase.models import Products, images as Images  # Alias the images model as Images
from django.core.files.base import ContentFile
import io
from PIL import Image
from homebase.models import Colors
from django.core.paginator import Paginator
from django.db.models import Q
from django.contrib.auth.decorators import login_required, user_passes_test

def is_customer(user):
    return user.is_authenticated and user.role == "customer"

def is_business(user):
    return user.is_authenticated and user.role == "business"




@login_required(login_url='login')
@user_passes_test(is_business, login_url='login')
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
@login_required(login_url='login')
@user_passes_test(is_business, login_url='login')
def deletepost(request, pk):
    product = get_object_or_404(Products, pk=pk)
    product.delete()
    messages.success(request, "Product deleted successfully!")
    return redirect("adminpage")
@login_required(login_url='login')
def Profile(request):
    context = {}
    # If the user is a business account, get their post count
    if request.user.role == 'business':
        post_count = Products.objects.filter(admin=request.user).count()
        context['post_count'] = post_count
    
    return render(request, 'profile.html', context)
@login_required(login_url='login')
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
        return redirect("profile")

    return render(request, "Edit_profile.html", {"user": user})
@login_required(login_url='login')
@user_passes_test(is_business, login_url='login')
def explore(request):
    # Get the search query from the request
    query = request.GET.get("search", "")

    # If a search query is provided, filter products based on the query
    if query:
        products = Products.objects.filter(
            Q(name__icontains=query) | Q(description__icontains=query)  
        )  # Prefetch likes
    else:
        # Otherwise, fetch all products for the logged-in admin
        products = Products.objects.all().order_by("name").prefetch_related('likes')  # Prefetch likes

    # Add pagination
    paginator = Paginator(products, 10)  # Show 10 products per page
    page_number = request.GET.get("page")  # Get the current page number from the query string
    page_object = paginator.get_page(page_number)  # Get the products for the current page

    # Fetch images for the products on the current page
    images = Images.objects.filter(product__in=page_object)

    # Pass data to the template
    context = {
        "products": page_object,  # Paginated products
        "images": images,         # Images for the current page's products
        "query": query,           # Pass the search query to the template
    }

    return render(request, "Explore.html", context)
@login_required(login_url='login')
def product_detail(request, pk):
    product = get_object_or_404(Products, pk=pk)
    product_images = Images.objects.filter(product=product)
    color=Colors.objects.filter(product=product)
    return render(request, 'detailed_post.html', {
        'product': product,
        'images': product_images,   
        "colors":color
    })

@login_required(login_url='login')
@user_passes_test(is_business, login_url='login')
def update_post(request, pk):
    # Fetch the product, images, and colors
    product = get_object_or_404(Products, pk=pk)
    product_images = Images.objects.filter(product=product)
    product_colors = Colors.objects.filter(product=product)

    if request.method == "POST":
        # Get updated values from the form
        title = request.POST.get("title")
        content = request.POST.get("content")
        categories = request.POST.get("category")
        images_files = request.FILES.getlist("images")  # Get multiple files
        colors = request.POST.get("colors")  # Get updated colors

        # Validate required fields
        if not title or not content:
            messages.error(request, "Title and Content are required")
            return render(request, "update_post.html", {
                "product": product,
                "product_images": product_images,
                "product_colors": product_colors
            })

        # Update product details
        product.name = title
        product.description = content
        product.categories = categories
        product.save()

        # Handle new images
        for image_file in images_files:
            try:
                # Save original image
                image_instance = Images.objects.create(
                    product=product,
                    image=image_file  # Save original image
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
                        if image_response.status_code == 200:
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

        # Update colors
        if colors:
            # Remove existing colors
            product_colors.delete()

            # Add new colors
            color_list = colors.split(",")  # Assuming colors are comma-separated
            for color_name in color_list:
                color_name = color_name.strip()  # Remove extra spaces
                if color_name:  # Ensure the color is not empty
                    Colors.objects.create(
                        product=product,
                        color=color_name
                    )

        messages.success(request, "Post updated successfully!")
        return redirect("adminpage")  # Redirect to admin page after update

    # Render the update form with existing data
    return render(request, "update_post.html", {
        "product": product,
        "product_images": product_images,
        "product_colors": product_colors
    })


