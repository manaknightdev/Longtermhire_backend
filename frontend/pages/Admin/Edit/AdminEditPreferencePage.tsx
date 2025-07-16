
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/context/Auth";
import { GlobalContext, showToast } from "@/context/Global";
import { MkdInput } from "@/components/MkdInput";
import { InteractiveButton } from "@/components/InteractiveButton";
import { LazyLoad } from "@/components/LazyLoad";
import { SkeletonLoader } from "@/components/Skeleton";

let sdk = new MkdSDK();

interface EditAdminPreferencePageProps {
  activeId: number | null;
  setSidebar: (sidebar: boolean) => void;
}

const EditAdminPreferencePage = ({activeId, setSidebar}: EditAdminPreferencePageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const navigate = useNavigate();
  
  
  const schema = yup
    .object({
      first_name: yup.string(),
last_name: yup.string(),
phone: yup.string(),
photo: yup.string(),
user_id: yup.string().required()
    })
    .required();
  
    const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const params = useParams();

  const fetchData = async () => {
    try {
      setLoading(true);
      sdk.setTable("preference");
      const result = await sdk.callRestAPI(
        { id: activeId ? activeId : Number(params?.id) },
        "GET"
      );
      
      if (!result.error) {
        setValue('first_name', result.model.first_name);
setValue('last_name', result.model.last_name);
setValue('phone', result.model.phone);
setValue('photo', result.model.photo);
setValue('user_id', result.model.user_id);
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.log("error", error);
      tokenExpireError(dispatch, error.message);
    }
  };


  const onSubmit = async (_data: yup.InferType<typeof schema>) => {
    setIsLoading(true);
    try {
      sdk.setTable("preference");
      const result = await sdk.callRestAPI(
        {
          id: activeId ? activeId : Number(params?.id),
          first_name: _data.first_name,
last_name: _data.last_name,
phone: _data.phone,
photo: _data.photo,
user_id: _data.user_id
        },
        "PUT"
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/preference");
        props.setSidebar(false);
        globalDispatch({
          type: "REFRESH_DATA",
          payload: {
            refreshData: true,
          },
        });
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.log("Error", error);
      tokenExpireError(dispatch, error.message);
    }
  };

  React.useEffect(() => {
    globalDispatch({
      type: "SETPATH",
      payload: {
        path: "preference",
      },
    });
  }, []);
  
  React.useEffect(function() {
    fetchData();
  }, [activeId, params?.id]);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Edit Preference</h4>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
          
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"first_name"}
      errors={errors}
      label={"First_name"}
      placeholder={"First_name"}
      register={register}
      className={""}
      />
    </LazyLoad>
    </div>
    

    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"last_name"}
      errors={errors}
      label={"Last_name"}
      placeholder={"Last_name"}
      register={register}
      className={""}
      />
    </LazyLoad>
    </div>
    

    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"phone"}
      errors={errors}
      label={"Phone"}
      placeholder={"Phone"}
      register={register}
      className={""}
      />
    </LazyLoad>
    </div>
    

    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"photo"}
      errors={errors}
      label={"Photo"}
      placeholder={"Photo"}
      register={register}
      className={""}
      />
    </LazyLoad>
    </div>
    

    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"user_id"}
      errors={errors}
      label={"User_id"}
      placeholder={"User_id"}
      register={register}
      className={""}
      />
    </LazyLoad>
    </div>
    
          
          <InteractiveButton
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            className="bg-primaryBlue text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Submit
          </InteractiveButton>
        </form>
      )}
    </div>
  );
};

export default EditAdminPreferencePage;