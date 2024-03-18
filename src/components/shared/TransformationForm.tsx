"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {z} from "zod"
import React, { useEffect, useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { startTransition } from "react"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  
import { Input } from "@/components/ui/input"
import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from "@/constants"
import { CustomField } from "./CustomField"
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils"
import MediaUploader from "./MediaUploader"
import TransformedImage from "./TransformedImage"
import { updateCredits } from "@/lib/actions/user.actions"
import { getCldImageUrl } from "next-cloudinary"
import { addImage, updateImage } from "@/lib/actions/image.actions"
import { useRouter } from "next/navigation"
import { InsufficientCreditsModal } from "./InsufficientCredits"

export const formSchema=z.object({
    title:z.string(),
    aspectRatio:z.string().optional(),
    color:z.string().optional(),
    prompt:z.string().optional(),
    publicId:z.string()

})

const TransformationForm = ({data=null,action,userId,type,creditBalance,config=null}:TransformationFormProps) => {
    const transformationType=transformationTypes[type]
    const router=useRouter()
    const [image,setImage]=useState(data)
    const [newTransformation,setNewTransformation]=useState<Transformations | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isTranforming, setIsTranforming] = useState(false)
    const [transformationConfig, setTransformationConfig] = useState(config)
    const [isPending,setTransition]=useTransition()

    const initialValues=data && action==='Update'?{
        title: data?.title,
        aspectRatio: data?.aspectRatio,
        color: data?.color,
        prompt: data?.prompt,
        publicId: data?.publicId,
    }:defaultValues
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialValues,
      })
    async function onSubmit(values:z.infer<typeof formSchema>) {
       setIsSubmitting(true)
       if(data||image){
        const transformationUrl=getCldImageUrl({
          width:image?.width,
          height:image?.height,
          src:image?.publicId,
          ...transformationConfig
        })
        const imageData={
          title:values.title,
          publicId:image?.publicId,
          transformationType:type,
          width:image?.width,
          height:image?.height,
          config:transformationConfig,
          secureURL:image?.secureURL,
          transformationURL:transformationUrl,
          aspectRatio:values.aspectRatio,
          prompt:values.prompt,
          color:values.color

        }

        if(action==='Add'){
          try {
            const newImage=await addImage({
              image:imageData,
              userId,
              path:'/'
            })
            if(newImage){ form.reset(); setImage(data);router.push(`/transformations/${newImage._id}`)}
          } catch (error) {
            console.log(error);
            
            
          }
        }
        if(action==='Update'){
          try {
            const updatedImage=await updateImage({
              image:{...imageData,_id:data._id},
              userId,
              path:`/transformations/${data._id}`
            })
            if(updatedImage){ router.push(`/transformations/${updatedImage._id}`)}
          } catch (error) {
            console.log(error);
            
            
          }
        }
       }
       setIsSubmitting(false)
        console.log("Success!", values)
     }
     const onSelectFieldHandler=(value:string,onChangeField:(value:string)=>void)=>{
        const imageSize=aspectRatioOptions[value as AspectRatioKey]
        setImage((prev:any)=>({...prev,aspectRatio:imageSize.aspectRatio,width:imageSize.width,height:imageSize.height})) 
        setNewTransformation(transformationType.config) 
        return onChangeField(value)

     }
     const onInputChangeHandler=(fieldName:string,value:string,type:string,onChangeField:(value:string)=>void)=>{
        debounce(()=>{
            setNewTransformation((prev:any)=>({...prev,[type]:{...prev?.[type],[fieldName==='prompt'?'prompt':'to']:value}}))
        },1000)()
        return onChangeField(value)
     }

     const onTranformHandler=async()=>{
      console.log('lets trand');
      
        setIsTranforming(true)
        console.log(isTranforming);
        
        setTransformationConfig(
          deepMergeObjects(newTransformation, transformationConfig)
        )
        console.log('merged');
        
        setNewTransformation(null)
      console.log('working');
      
        setTransition(async () => {
          await updateCredits(userId, creditFee)
        })

     }

     useEffect(()=>{
      if(image && (type==='restore' || type==='removeBackground'))
      setNewTransformation(transformationType.config)
     },[image,transformationType.config,type])
  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <CustomField control={form.control} name='title' formLabel="Image  Title" render={({field})=><Input {...field} className="input-field"/>} className="w-full" />
        {creditBalance< Math.abs(creditFee) && <InsufficientCreditsModal/>}
        
        {type==='fill' && (
             <CustomField control={form.control} name='aspectRatio' formLabel="Aspect Ratio" render={({field})=><Select onValueChange={(val)=> onSelectFieldHandler(val,field.onChange)} value={field.value}>
             <SelectTrigger className="select-field">
               <SelectValue placeholder="Select size" />
             </SelectTrigger>
             <SelectContent>
               {Object.keys(aspectRatioOptions).map(key=>(
                <SelectItem className="select-item" key={key} value={key}>
                   {aspectRatioOptions[key as AspectRatioKey].label} </SelectItem>
               ))}
             </SelectContent>
           </Select>}/>
           

        )}

        {(type==='remove'|| type==='recolor') && (
            <div className="prompt-field">
                <CustomField control={form.control} name="prompt" formLabel={type==='remove'?'Object to remove' :'Object to recolor'} className="w-full" render={({field})=>(
                    <Input value={field.value} className="input-field" onChange={(e)=>onInputChangeHandler('prompt',e.target.value,type,field.onChange)}/>
                )}/>
            {type==='recolor' && (<CustomField name='color' control={form.control} className="w-full" formLabel="Replacement Color" render={({field})=>(<Input value={field.value} className="input-field" onChange={(e)=>onInputChangeHandler('color',e.target.value,'recolor',field.onChange)}/>)}/>)}
            </div>
        )}

        <div className="media-uploader-field">
          <CustomField control={form.control} name='publicId' className="flex flex-col size-full" render={({field})=>(
        
           
              <MediaUploader onValueChange={field.onChange} setImage={setImage} publicId={field.value} image={image} type={type}/>
           
          )}/>
        <TransformedImage image={image} type={type} title={form.getValues().title} isTransforming={isTranforming} setIsTransforming={setIsTranforming} transformationConfig={transformationConfig} />
        </div>
        
        <div className="flex flex-col gap-4">
        <Button type='button' className="submit-button capitalize" disabled={isTranforming|| newTransformation===null} onClick={onTranformHandler}>{isTranforming?'Transforming...':'Apply transformation'}</Button>
        <Button type='submit' className="submit-button capitalize" disabled={isSubmitting}>{isSubmitting?'Submitting...':'Save Image'}</Button>
        </div>
 

    </form>
  </Form>
  )
}

export default TransformationForm