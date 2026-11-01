import { useId, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
interface Props {label:string;value:string;onChange:(value:string)=>void;error?:string;disabled?:boolean;multiline?:boolean;numeric?:boolean;step?:string;max?:number;maxLength?:number;help?:string}
export const ReturnField = ({label,value,onChange,error,disabled,multiline,numeric,step,max,maxLength,help}:Props) => {
 const id=useId();const props={id,value,disabled,maxLength,"aria-invalid":Boolean(error),"aria-describedby":error?`${id}-error`:help?`${id}-help`:undefined,onChange:(event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>onChange(event.target.value)};
 return <div className="min-w-0 space-y-1.5"><label htmlFor={id} className="text-sm font-medium">{label}</label>{multiline?<Textarea {...props}/>:<Input {...props} type={numeric?"number":"text"} inputMode={numeric?"decimal":undefined} min={numeric?0:undefined} step={step} max={max}/>} {help&&<p id={`${id}-help`} className="text-xs text-muted-foreground">{help}</p>}{error&&<p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}</div>;
};
