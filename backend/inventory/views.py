from django.shortcuts import render
from .models import Brand, Phone, Item
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import BrandSerializer,PhoneSerializer
from rest_framework.decorators import api_view
from barcode import EAN13
from barcode.writer import SVGWriter
import io
from django.http import FileResponse
from enterprise.models import Branch
from rest_framework import status



# Create your views here.

class BrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,branch=None,*args, **kwargs):
        id = request.GET.get("id")
        if id:
            brand = Brand.objects.get(id=id)
            phones = Phone.objects.filter(brand = brand)
            if phones:
                serializer = PhoneSerializer(phones,many=True)
                return Response(serializer.data)
            else:
                return Response([])
        brands=Brand.objects.all()
        brands = Brand.objects.filter(enterprise = request.user.employee.enterprise)
        if branch:
            brands = brands.filter(branch=branch)
        serializer = BrandSerializer(brands,many=True)
        return Response(serializer.data)

    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.employee.enterprise.id
        serializer = BrandSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)
        
    def delete(self,request,id):
        if request.user.employee.role != "Admin":
            return Response("UNAUTHORIZED")
        brand = Brand.objects.get(id=id)
        brand.delete()
        return Response("DELETED")
        
class PhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id=None, branch=None,*args, **kwargs):
        phones=Phone.objects.all()
        phones = Phone.objects.filter(brand__enterprise = request.user.employee.enterprise)
        if id:
            try:
                phone = Phone.objects.get(id=id)
                serializer = PhoneSerializer(phone)
                return Response(serializer.data)
            except Phone.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        if branch:
            phones = phones.filter(branch=branch)
        serializer = PhoneSerializer(phones,many=True)
        return Response(serializer.data)

    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.employee.enterprise.id
        serializer = PhoneSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            #print("YAHA SAMMAAA")
            serializer.save()
            return Response(serializer.data)
        
    def patch(self,request,id):
        data = request.data
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        data['enterprise'] = request.user.employee.enterprise.id
        
        try:
            phone = Phone.objects.get(id=id)
        except Phone.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = PhoneSerializer(phone,data=data,partial=True)
        if serializer.is_valid():
            serializer.save()
            old_stock = phone.stock if phone.stock else 0
            phone.stock = phone.count * phone.selling_price
            phone.brand.stock = phone.brand.stock - old_stock + phone.stock
            phone.brand.save()
            phone.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self,request,id):
        print(request.user.employee.role)
        if request.user.employee.role != "Admin":
            return Response("UNAUTHORIZED")
        phone = Phone.objects.get(id=id)
        phone.delete()
        return Response("DELETED")

class PhoneIMEIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,id,branch=None):
        user = request.user
        phone = Phone.objects.filter(id = id).first()
        if branch:
            phone = phone.filter(branch=branch).first()
        #print(phone)
        items = Item.objects.filter(phone=phone)
        if branch:
            items = items.filter(branch=branch)
        imei_list = []

        for item in items:
            imei_list.append(item.imei_number)
            
        return Response({"phone":phone.name,"list":imei_list})
    
@api_view(['GET'])
def generate_barcode(request):
    barcode = EAN13('123456789012', writer=SVGWriter())
    
    buffer = io.BytesIO()
    barcode.write(buffer)
    buffer.seek(0)

    print("BARCODE GENERATED")
    return FileResponse(buffer, content_type='image/svg+xml')



class MergeBrandView(APIView):
    def post(self,request,selfbranch,mergebranch,format=None):
        
        branch = Branch.objects.get(id=mergebranch)
        print(branch.name)
        # return Response("Merged")

        for brand in Brand.objects.filter(branch=branch):
            if brand.name in Brand.objects.filter(branch_id=selfbranch).values_list('name',flat=True):
                continue
            Brand.objects.create(name=brand.name,enterprise=brand.enterprise,branch_id=selfbranch)
        


class MergeBrandView(APIView):
    def post(self,request,selfbranch,mergebranch,format=None):
        
        branch = Branch.objects.get(id=mergebranch)
        print(branch.name)
        # return Response("Merged")

        for brand in Brand.objects.filter(branch=branch):
            if brand.name in Brand.objects.filter(branch_id=selfbranch).values_list('name',flat=True):
                continue
            Brand.objects.create(name=brand.name,enterprise=brand.enterprise,branch_id=selfbranch)
        

        #now merge the products as well
        for brand in Brand.objects.filter(branch=selfbranch):
            print("BRAND ",brand.name)
            for phone in Phone.objects.filter(branch=branch,brand__name=brand.name):
                print("PHONE ",phone.name)
                if Phone.objects.filter(branch_id=selfbranch, brand__name__iexact=brand.name, name__iexact=phone.name).exists():
                    continue
                p = Phone.objects.create(name=phone.name,enterprise=phone.enterprise,branch_id=selfbranch,cost_price=phone.cost_price,selling_price=phone.selling_price,brand_id=brand.id)
                print("CREATED",p)
        return Response("Merged")

class MergeProductBrandView(APIView):
    def post(self,request,selfbranch,mergebranch,brand,format=None):
        print("MERGING PRODUCTS")
        brand = Brand.objects.get(id=brand)
        phones = Phone.objects.filter(branch_id=mergebranch,brand__name__iexact=brand.name)
        print("THERESASDSAD ",phones)
        for phone in Phone.objects.filter(branch_id=mergebranch,brand__name__iexact=brand.name):
            if Phone.objects.filter(branch_id=selfbranch, brand=brand, name__iexact=phone.name).exists():
                print("HERE")
                continue
            p = Phone.objects.create(name=phone.name,enterprise=phone.enterprise,branch_id=selfbranch,cost_price=phone.cost_price,selling_price=phone.selling_price,brand_id=brand.id)
            print("CREATED",p)
            
        return Response("Merged")