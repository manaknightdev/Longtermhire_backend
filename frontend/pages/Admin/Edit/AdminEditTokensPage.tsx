
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

interface EditAdminTokensPageProps {
  activeId: number | null;
  setSidebar: (sidebar: boolean) => void;
}

const EditAdminTokensPage = ({activeId, setSidebar}: EditAdminTokensPageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const navigate = useNavigate();
  
  
  const schema = yup
    .object({
      user_id: yup.string().required(),
token: yup.string().required(),
code: yup.string().required(),
type: yup.string().required(),
data: yup.string(),
status: yup.string().required(),
expired_at: yup.string()
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
      sdk.setTable("tokens");
      const result = await sdk.callRestAPI(
        { id: activeId ? activeId : Number(params?.id) },
        "GET"
      );
      
      if (!result.error) {
        setValue('user_id', result.model.user_id);
setValue('token', result.model.token);
setValue('code', result.model.code);
setValue('type', result.model.type);
setValue('data', result.model.data);
setValue('status', result.model.status);
setValue('expired_at', result.model.expired_at);
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
      sdk.setTable("tokens");
      const result = await sdk.callRestAPI(
        {
          id: activeId ? activeId : Number(params?.id),
          user_id: _data.user_id,
token: _data.token,
code: _data.code,
type: _data.type,
data: _data.data,
status: _data.status,
expired_at: _data.expired_at
        },
        "PUT"
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/tokens");
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
        path: "tokens",
      },
    });
  }, []);
  
  React.useEffect(function() {
    fetchData();
  }, [activeId, params?.id]);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Edit Tokens</h4>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
          
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
      name={"token"}
      errors={errors}
      label={"Token"}
      placeholder={"Token"}
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
      name={"code"}
      errors={errors}
      label={"Code"}
      placeholder={"Code"}
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
    

    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"data"}
      errors={errors}
      label={"Data"}
      placeholder={"Data"}
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
      name={"status"}
      errors={errors}
      label={"Status"}
      placeholder={"Status"}
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
      name={"expired_at"}
      errors={errors}
      label={"Expired_at"}
      placeholder={"Expired_at"}
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

export default EditAdminTokensPage;