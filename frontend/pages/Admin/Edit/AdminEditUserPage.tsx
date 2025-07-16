
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

interface EditAdminUserPageProps {
  activeId: number | null;
  setSidebar: (sidebar: boolean) => void;
}

const EditAdminUserPage = ({activeId, setSidebar}: EditAdminUserPageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const navigate = useNavigate();
  
  
  const schema = yup
    .object({
      email: yup.string().required(),
password: yup.string().required(),
login_type: yup.string().required(),
role_id: yup.string(),
data: yup.string(),
status: yup.string().required(),
verify: yup.string().required(),
two_factor_authentication: yup.string(),
company_id: yup.string(),
stripe_uid: yup.string()
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
      sdk.setTable("user");
      const result = await sdk.callRestAPI(
        { id: activeId ? activeId : Number(params?.id) },
        "GET"
      );
      
      if (!result.error) {
        setValue('email', result.model.email);
setValue('password', result.model.password);
setValue('login_type', result.model.login_type);
setValue('role_id', result.model.role_id);
setValue('data', result.model.data);
setValue('status', result.model.status);
setValue('verify', result.model.verify);
setValue('two_factor_authentication', result.model.two_factor_authentication);
setValue('company_id', result.model.company_id);
setValue('stripe_uid', result.model.stripe_uid);
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
      sdk.setTable("user");
      const result = await sdk.callRestAPI(
        {
          id: activeId ? activeId : Number(params?.id),
          email: _data.email,
password: _data.password,
login_type: _data.login_type,
role_id: _data.role_id,
data: _data.data,
status: _data.status,
verify: _data.verify,
two_factor_authentication: _data.two_factor_authentication,
company_id: _data.company_id,
stripe_uid: _data.stripe_uid
        },
        "PUT"
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/user");
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
        path: "user",
      },
    });
  }, []);
  
  React.useEffect(function() {
    fetchData();
  }, [activeId, params?.id]);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Edit User</h4>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
          
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
      name={"email"}
      errors={errors}
      label={"Email"}
      placeholder={"Email"}
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
      name={"password"}
      errors={errors}
      label={"Password"}
      placeholder={"Password"}
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
      name={"login_type"}
      errors={errors}
      label={"Login_type"}
      placeholder={"Login_type"}
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
      name={"role_id"}
      errors={errors}
      label={"Role_id"}
      placeholder={"Role_id"}
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
      name={"verify"}
      errors={errors}
      label={"Verify"}
      placeholder={"Verify"}
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
      name={"two_factor_authentication"}
      errors={errors}
      label={"Two_factor_authentication"}
      placeholder={"Two_factor_authentication"}
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
      name={"company_id"}
      errors={errors}
      label={"Company_id"}
      placeholder={"Company_id"}
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
      name={"stripe_uid"}
      errors={errors}
      label={"Stripe_uid"}
      placeholder={"Stripe_uid"}
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

export default EditAdminUserPage;