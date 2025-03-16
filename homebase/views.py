import requests
from django.contrib import messages
from django.shortcuts import render,redirect    
from homebase.models import Products
from django.core.files.base import ContentFile
import os

def is_jpeg(image):
    ext =os.path.splitext(image.name)[1].lower()
    return ext in [".jpeg" ,".jpg",".webp"]#check if file extention is jpg and jpeg returns true if matched




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

def Profile(request):
    return render(request,"admin_profile.html")