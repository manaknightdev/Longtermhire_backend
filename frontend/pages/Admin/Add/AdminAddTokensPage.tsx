
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

interface AddAdminTokensPageProps {
  setSidebar: (sidebar: boolean) => void;
}

const AddAdminTokensPage = ({setSidebar}: AddAdminTokensPageProps) => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
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
      sdk.setTable("tokens");

      const result = await sdk.callRestAPI(
        {
          user_id: _data.user_id,
token: _data.token,
code: _data.code,
type: _data.type,
data: _data.data,
status: _data.status,
expired_at: _data.expired_at
        },
        "POST"
      );

      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/tokens");
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
        path: "tokens",
      },
    });
  }, []);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Add Tokens</h4>
      <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
        
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"}
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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

export default AddAdminTokensPage;