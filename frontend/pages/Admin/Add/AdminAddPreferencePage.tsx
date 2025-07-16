
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

interface AddAdminPreferencePageProps {
  setSidebar: (sidebar: boolean) => void;
}

const AddAdminPreferencePage = ({setSidebar}: AddAdminPreferencePageProps) => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup
    .object({
      first_name: yup.string(),
last_name: yup.string(),
phone: yup.string(),
photo: yup.string(),
user_id: yup.string().required()
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
      sdk.setTable("preference");

      const result = await sdk.callRestAPI(
        {
          first_name: _data.first_name,
last_name: _data.last_name,
phone: _data.phone,
photo: _data.photo,
user_id: _data.user_id
        },
        "POST"
      );

      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/preference");
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
        path: "preference",
      },
    });
  }, []);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Add Preference</h4>
      <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
        
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"}
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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
      page={"add"}
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

export default AddAdminPreferencePage;