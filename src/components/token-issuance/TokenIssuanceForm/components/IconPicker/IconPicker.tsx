import {
  Button,
  FormControl,
  FormErrorMessage,
  Icon,
  Img,
  useColorModeValue,
} from "@chakra-ui/react"
import { ImageSquare } from "phosphor-react"
import { useEffect, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { TokenIssuanceFormType } from "types"
import useDropzone from "./hooks/useDropzone"

const errorMessages = {
  "file-too-large": "This image is too large, maximum allowed file size is 5MB",
}

const IconPicker = (): JSX.Element => {
  const buttonColor = useColorModeValue("white", "blackAlpha.300")

  const { control, register, setValue } = useFormContext<TokenIssuanceFormType>()

  useEffect(() => {
    register("icon")
  }, [register])

  const icon = useWatch({ control, name: "icon" })
  const [iconSrc, setIconSrc] = useState<string>(null)

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result?.toString())
      reader.onerror = (error) => reject(error)
    })

  useEffect(() => {
    if (!icon) return setIconSrc(null)
    toBase64(icon)
      .then((url) => setIconSrc(url))
      .catch((_) => null)
  }, [icon])

  const { fileRejections, getRootProps, getInputProps } = useDropzone({
    multiple: false,
    onDrop: async (accepted) => {
      if (!accepted?.length) return
      setValue("icon", accepted[0])
    },
  })

  return (
    <FormControl isInvalid={!!fileRejections?.[0]}>
      <Button
        {...getRootProps()}
        as="label"
        autoFocus
        aria-label="Upload token icon"
        rounded="full"
        boxSize={12}
        flexShrink={0}
        colorScheme="gray"
        variant="outline"
        borderWidth={1}
        bg={buttonColor}
        overflow="hidden"
        p={0}
      >
        <input {...getInputProps()} hidden />
        {iconSrc ? (
          <Img src={iconSrc} alt="Token icon" boxSize={12} />
        ) : (
          <Icon as={ImageSquare} />
        )}
      </Button>

      <FormErrorMessage>
        {errorMessages[fileRejections?.[0]?.errors?.[0]?.code] ??
          fileRejections?.[0]?.errors?.[0]?.message}
      </FormErrorMessage>
    </FormControl>
  )
}

export default IconPicker