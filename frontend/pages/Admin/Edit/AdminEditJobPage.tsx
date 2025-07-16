
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

interface EditAdminJobPageProps {
  activeId: number | null;
  setSidebar: (sidebar: boolean) => void;
}

const EditAdminJobPage = ({activeId, setSidebar}: EditAdminJobPageProps) => {
  const { dispatch } = React.useContext(AuthContext);
  
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const navigate = useNavigate();
  
  
  const schema = yup
    .object({
      task: yup.string().required(),
arguments: yup.string(),
time_interval: yup.string(),
retries: yup.string(),
status: yup.string()
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
      sdk.setTable("job");
      const result = await sdk.callRestAPI(
        { id: activeId ? activeId : Number(params?.id) },
        "GET"
      );
      
      if (!result.error) {
        setValue('task', result.model.task);
setValue('arguments', result.model.arguments);
setValue('time_interval', result.model.time_interval);
setValue('retries', result.model.retries);
setValue('status', result.model.status);
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
      sdk.setTable("job");
      const result = await sdk.callRestAPI(
        {
          id: activeId ? activeId : Number(params?.id),
          task: _data.task,
arguments: _data.arguments,
time_interval: _data.time_interval,
retries: _data.retries,
status: _data.status
        },
        "PUT"
      );

      if (!result.error) {
        showToast(globalDispatch, "Updated");
        navigate("/admin/job");
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
        path: "job",
      },
    });
  }, []);
  
  React.useEffect(function() {
    fetchData();
  }, [activeId, params?.id]);

  return (
    <div className="shadow-md rounded mx-auto p-5">
      <h4 className="text-2xl font-medium">Edit Job</h4>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <form className="w-full max-w-lg" onSubmit={handleSubmit(onSubmit)}>
          
    <div className="mb-4">
    <LazyLoad>
    <MkdInput
      type={"text"} 
      page={"edit"}
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
      page={"edit"}
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
      page={"edit"}
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
      page={"edit"}
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

export default EditAdminJobPage;