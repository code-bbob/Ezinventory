from rest_framework import serializers
from . models import Brand,Phone,Item

class BrandSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField(read_only = True)
    amount = serializers.SerializerMethodField(read_only = True)
    class Meta:
        model = Brand
        fields = '__all__'

    def get_items(self,obj):
        items = Item.objects.filter(phone__brand = obj).count()
        return items
    
    def get_amount(self,obj):
        items = Item.objects.filter(phone__brand = obj)
        amount = 0
        for item in items:
            amount = (amount + item.phone.selling_price) if item.phone.selling_price else amount
        return amount




class PhoneSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField(read_only = True)
    imeis = serializers.SerializerMethodField(read_only= True)

    class Meta:
        model = Phone 
        fields = "__all__"

    
    def get_brand_name(self,obj):
        return obj.brand.name

    def get_imeis(self,obj):
        imeis = obj.item.all()
        list = []
        for imei in imeis:
            list.append(imei.imei_number)
        return list