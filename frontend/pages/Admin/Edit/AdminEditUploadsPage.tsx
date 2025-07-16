
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

interface EditAdminUploadsPageProps {
  activeId: number | null;
  setSidebar: (sidebar: boolean) => void;
}

const EditAdminUploadsPage = ({activeId, setSidebar}: EditAdminUploadsPageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const navigate = useNavigate();
  
  
  const schema = yup
    .object({
      url: yup.string().required(),
caption: yup.string(),
user_id: yup.string(),
width: yup.string(),
height: yup.string(),
type: yup.string().required()
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
      sdk.setTable("uploads");
      const result = await sdk.callRestAPI(
        { id: activeId ? activeId : Number(params?.id) },
        "GET"
      );
      
      if (!result.error) {
        setValue('url', result.model.url);
setValue('caption', result.model.caption);
setValue('user_id', result.model.user_id);
setValue('width', result.model.width);
setValue('height', result.model.height);
setValue('type', result.model.type);
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
      sdk.setTable("uploads");
      const result = await sdk.callRestAPI(
        {
          id: activeId ? activeId : Number(params?.id),
          url: _data.url,
caption: _data.caption,
user_id: _data.user_id,
width: _data.width,
height: _data.height,
type: _data.type
        },
        "PUT"
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/uploads");
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
        path: "uploads",
      },
    });
  }, []);
  
  React.useEffect(function() {
    fetchData();
  }, [activeId, params?.id]);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Edit Uploads</h4>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
          
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"url"}
      errors={errors}
      label={"Url"}
      placeholder={"Url"}
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
      name={"caption"}
      errors={errors}
      label={"Caption"}
      placeholder={"Caption"}
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
    

    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"width"}
      errors={errors}
      label={"Width"}
      placeholder={"Width"}
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
      name={"height"}
      errors={errors}
      label={"Height"}
      placeholder={"Height"}
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
      name={"type"}
      errors={errors}
      label={"Type"}
      placeholder={"Type"}
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

export default EditAdminUploadsPage;