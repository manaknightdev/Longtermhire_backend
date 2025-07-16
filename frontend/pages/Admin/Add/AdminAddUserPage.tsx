
import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import MkdSDK from "@/utils/MkdSDK";
import { useNavigate } from "react-router-dom";
import { AuthContext, tokenExpireError } from "@/context/Auth";
import { GlobalContext, showToast } from "@/context/Global";
import { MkdInput } from "@/components/MkdInput";
import { InteractiveButton } from "@/components/InteractiveButton";
import { LazyLoad } from "@/components/LazyLoad";

interface AddAdminUserPageProps {
  setSidebar: (sidebar: boolean) => void;
}

const AddAdminUserPage = ({setSidebar}: AddAdminUserPageProps) => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
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

  const { dispatch } = React.useContext(AuthContext);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (_data) => {
    setIsSubmitLoading(true);
    try {
      let sdk = new MkdSDK();
      sdk.setTable("user");

      const result = await sdk.callRestAPI(
        {
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
        "POST"
      );

      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/user");
        setSidebar(false);
        globalDispatch({
          type: "REFRESH_DATA",
          payload: {
            refreshData: true,
          },
        });
      }
      setIsSubmitLoading(false);
    } catch (error) {
      setIsSubmitLoading(false);
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

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Add User</h4>
      <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
        
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"}
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
          loading={isSubmitLoading}
          disabled={isSubmitLoading}
          className="bg-primaryBlue text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Submit
        </InteractiveButton>
      </form>
    </div>
  );
};

export default AddAdminUserPage;