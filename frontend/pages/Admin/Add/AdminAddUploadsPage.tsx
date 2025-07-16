
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

interface AddAdminUploadsPageProps {
  setSidebar: (sidebar: boolean) => void;
}

const AddAdminUploadsPage = ({setSidebar}: AddAdminUploadsPageProps) => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
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
      sdk.setTable("uploads");

      const result = await sdk.callRestAPI(
        {
          url: _data.url,
caption: _data.caption,
user_id: _data.user_id,
width: _data.width,
height: _data.height,
type: _data.type
        },
        "POST"
      );

      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/uploads");
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
        path: "uploads",
      },
    });
  }, []);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Add Uploads</h4>
      <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
        
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"}
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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

export default AddAdminUploadsPage;