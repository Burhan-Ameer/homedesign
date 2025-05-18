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
    path("profile/",homeviews.Profile,name="profile"),
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
    path("pricing/",views.pricing,name="pricing"),
    # canvas page
    path("canvas/",dusers.canvas,name="canvas"),
    #   collection page
    path("collections/",dusers.collections,name="collection"),
    # addition to collections 
    path("add_to_collection/<int:product_id>/",dusers.add_to_collection,name="add_to_collection"),
    
    path("products/",dusers.products,name="products"),
    # feedback page
    path("feedback/",views.feedback,name="feedback"),

    path('collections/remove/<int:product_id>/', dusers.remove_from_collection, name='remove_collection_item'),
    path('collections/clear/', dusers.clear_collection,name='clear_collection'),
    path("superuserdashboard/",views.dashboard_superuser,name="dashboard_superuser"),
    path('superuser/feedback/<int:feedback_id>/reply/',views.reply_feedback,name='reply_feedback'),
    path('feedback/edit/<int:feedback_id>/', views.edit_feedback, name='edit_feedback'),
    path('like/<int:product_id>/', dusers.toggle_like, name='toggle_like'),
    path("saved/",dusers.saved_designs,name="saved"),
    path('api/save-design/', dusers.save_design, name='save_design'),
    path('api/get-design/<str:design_id>/', dusers.get_design, name='get_design'),
    path('silk/', include('silk.urls', namespace='silk'))
]

# Add static/media URLs for development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
