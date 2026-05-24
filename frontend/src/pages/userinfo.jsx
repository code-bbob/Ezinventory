import { useState, useEffect } from "react";
import { useParams } from "react-router";
import axios from "axios";
import useAxios from '@/utils/useAxios';
import Navbar from "@/components/navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import UserProfile from "@/components/userprofile";
import EditUser from "@/components/edituser";

const UserInfo = () => {
    const params = useParams();
    const userId = params.id;
    const api = useAxios();

    const [user, setUser] = useState([]);

    useEffect(() => {
        async function getUser() {
            try {
                const url = userId?`api/userauth/info/${userId}`:`api/userauth/info/`;
                const response = await api.get(url);
                setUser(response.data);
                
            } catch (e) {
                console.log(e);
            }   
        }
        getUser();
        
    },[]);
    // This is a single group page that contains the name of the group, list of users it has on the side and the commits made in that group.
    
    return(
        <>
        <Navbar />
        <UserProfile user = {user}/>
        <EditUser/>
        <div>HI {user?.userinfo?.name}</div>
        </>

    );

}

export default UserInfo