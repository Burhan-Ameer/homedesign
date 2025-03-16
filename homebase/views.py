import requests
from django.contrib import messages
from django.shortcuts import render,redirect    
from homebase.models import Products
from django.core.files.base import ContentFile
import os
from homeusers.models import CustomUser

def is_jpeg(image):
    ext =os.path.splitext(image.name)[1].lower()
    return ext in [".jpeg" ,".jpg",".webp"]#check if file extention is jpg and jpeg returns true if matched
#  post creation view
def createpost(request):
    if request.method == "POST":
        title = request.POST.get("title")
        content = request.POST.get("content")
        categories = request.POST.get("category") 
        image_1 = request.FILES.get("image1")
    # just to check if the form is not empty
        if not title or not content:
            messages.error(request,"Title and Content are required ")
            return render( request,"createpost.html")

        if image_1 and  not is_jpeg(image_1):
            messages.error(request,"please upload only JPEG,WEBP images")
            return render(request,"createpost.html")
        # saving the products information without bg removed
        product = Products(
            admin=request.user,
                name=title,
                description=content,
                image=image_1,
                categories=categories
            )
        if image_1 :
            response = requests.post(
                'https://api.remove.bg/v1.0/removebg',
                files={'image_file': image_1},
                data={'size': 'auto'},
                headers={'X-Api-Key': 'a9zYMHSpRhTgkeRYstbfEjN6'},
                )
            if response.status_code == 200:
                # as the response is in byte i dont know what that is but unreadable i guess so we converted  it into image_file    
                image_content=ContentFile(response.content)
                product.image_2d.save(
                    f"{product.name}_2d.png",
                    image_content,
                    save=False )
                
            else:
                messages.error(request, "Error occured please try again")
        product.save()
        messages.success(request, "Product Created Successfully!")
    return render(request, "createpost.html")   
def deleteposts(request,pk):
    product=Products.objects.get(id=pk)
# just to view profile 
def Profile(request):
    return render(request,"admin_profile.html")
# editing admins profile
def edit_profile(request):
    user=request.user
    if request.method=="POST":
        profile_pic=request.FILES.get("profile_pic")
        email=request.POST.get("email")
        website=request.POST.get("website")
        location=request.POST.get("location")
        bio=request.POST.get("bio")
        if email:
            user.email=email
        if profile_pic:
            user.profile_pic=profile_pic
        if website:
            user.website =website
        if location:
            user.location=location
        if bio:
            user.Bio=bio
        user.save()
        # these all are to ensure that the fields are updated only when we have something to update the fields if empty then nothing to update 
        messages.success(request,"Successfully updated the Profile")
        return redirect("admin_profile")
    return render(request,"Edit_profile.html")