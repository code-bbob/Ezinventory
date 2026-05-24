from django.urls import path
from .views import BrandView,PhoneView, PhoneIMEIView,generate_barcode, MergeBrandView, MergeProductBrandView

urlpatterns = [
    path('brand/',BrandView.as_view(), name='brand'),
    path('brand/<int:id>/',BrandView.as_view(), name='brand'),
    path('phone/',PhoneView.as_view(),name = 'phone'),
    path('phone/imeis/<str:id>/', PhoneIMEIView.as_view(), name='phoneimei'),
    path('phone/<int:id>/',PhoneView.as_view(),name = 'phone'),
    path('phone/branch/<int:branch>/', PhoneView.as_view()),
    path('deletephone/<int:id>/',PhoneView.as_view(),name = 'phone'),
    path('brand/branch/<int:branch>/', BrandView.as_view()),
    path('brand/branch/<int:selfbranch>/merge/<int:mergebranch>/', MergeBrandView.as_view()),
    path('product/branch/<int:selfbranch>/brand/<int:brand>/merge/<int:mergebranch>/', MergeProductBrandView.as_view()),


    path('barcode/',generate_barcode,name = 'barcode'),
]
