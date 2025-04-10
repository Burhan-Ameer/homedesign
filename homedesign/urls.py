"""
URL configuration for homedesign project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views
from homebase import views as homeviews
from dvp_user_side import views as dusers
urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),  # Homepage
    path('', include('homeusers.urls')),  # Include app URLs
    path("__reload__/", include("django_browser_reload.urls")), # For Tailwind reload
    #admin page
    path("adminpage/",views.adminpage,name="adminpage"),
    # create post url
    path("createpost/",homeviews.createpost,name="createpost"),
    # delete post url
    path("deletepost/<int:pk>/",homeviews.deletepost,name="deletepost"),
    # about us page
    path("aboutus/",views.aboutus,name="about"),
    # admin Profile
    path("admin_profile/",homeviews.Profile,name="admin_profile"),
    # edit admin Profile
    path("edit_profile/",homeviews.edit_profile,name="edit_profile"),

    # explore url in admin panel
    path("explore/",homeviews.explore,name="explore"),
    # detail of  product path
    path("detailed_product/<int:pk>/",homeviews.product_detail,name="product_detailed") ,
    # update post 
    path("updateposts/<int:pk>/",homeviews.update_post,name="update_post"),
    # brands route 
    path("brands/",dusers.brands,name="brands"),
    # brand details route
    path("brand_details/<str:username>/",dusers.brand_details,name="brand_details"),
    # pricing page
    path("pricing/",views.pricing,name="pricing")

]

# Add static/media URLs for development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
