from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from homeusers.models  import CustomUser
def Login_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        # Print debug info
        print(f"Login attempt for user: {username}")
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            print(f"User role: {user.role}")
            
            # Get next URL or use default based on role
            next_url = request.GET.get('next')
            if next_url:
                return redirect(next_url)
                
            if user.role == "business":
                return redirect("adminpage")
            else:
                return redirect("home")
        else:
            messages.error(request, "Invalid credentials")
            print("Authentication failed")
    
    return render(request, "Login.html")

def Register(request):
    if request.method=="POST":
        username = request.POST.get("username")
        email=request.POST.get("email")
        password = request.POST.get("password")
        confirm_password=request.POST.get("confirm_password")
        role=request.POST.get("account_type")
        if CustomUser.objects.filter(username=username).exists():
            messages.error( request,"username already exists try another one")
            return render(request,"Register.html")
        if not all([username, email, password, confirm_password, role]):
            messages.error(request, "All fields are required")
            return render(request, "Register.html")

        if password==confirm_password:
            user=CustomUser.objects.create_user(
                username=username,
                password=confirm_password,
                role=role,   
            )
            messages.success(request,"Registration Successfull")
            login(request,user)
            if request.user.is_user():
                return redirect("home")
            else:
                return redirect("adminpage")
        else:
            messages.error(request,"Passwords does not match")
    return render(request,"Register.html")

def logout_page(request):
    logout(request)
    messages.success(request, "Logged out successfully")
    return redirect('login')    
def Profile(request):
    return render(request,"profile.html")