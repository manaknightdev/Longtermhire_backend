
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

interface AddAdminJobPageProps {
  setSidebar: (sidebar: boolean) => void;
}

const AddAdminJobPage = ({setSidebar}: AddAdminJobPageProps) => {
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const schema = yup
    .object({
      task: yup.string().required(),
arguments: yup.string(),
time_interval: yup.string(),
retries: yup.string(),
status: yup.string()
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
      sdk.setTable("job");

      const result = await sdk.callRestAPI(
        {
          task: _data.task,
arguments: _data.arguments,
time_interval: _data.time_interval,
retries: _data.retries,
status: _data.status
        },
        "POST"
      );

      if (!result.error) {
        showToast(globalDispatch, "Added");
        navigate("/admin/job");
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
        path: "job",
      },
    });
  }, []);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Add Job</h4>
      <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
        
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"}
      page={"add"}
      name={"task"}
      errors={errors}
      label={"Task"}
      placeholder={"Task"}
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
      name={"arguments"}
      errors={errors}
      label={"Arguments"}
      placeholder={"Arguments"}
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
      name={"time_interval"}
      errors={errors}
      label={"Time_interval"}
      placeholder={"Time_interval"}
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
      name={"retries"}
      errors={errors}
      label={"Retries"}
      placeholder={"Retries"}
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

export default AddAdminJobPage;