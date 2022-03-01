import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
} from "@chakra-ui/react"
import { useEffect } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { TokenIssuanceFormType } from "types"

const MaxSupplyForm = (): JSX.Element => {
  const {
    control,
    getValues,
    trigger,
    formState: { errors, dirtyFields },
  } = useFormContext<TokenIssuanceFormType>()

  const initialSupply = useWatch({ control, name: "initialSupply" })
  const maxSupply = useWatch({ control, name: "maxSupply" })

  useEffect(() => {
    if (!dirtyFields.maxSupply) return
    trigger("maxSupply")
  }, [initialSupply])

  useEffect(() => {
    if (!dirtyFields.initialSupply) return
    trigger("initialSupply")
  }, [maxSupply])

  return (
    <SimpleGrid gridTemplateColumns="repeat(2, 1fr)" gap={4} px={5} pb={4}>
      <FormControl
        minW={0}
        isInvalid={!!errors?.initialSupply}
        isRequired={getValues("inflationaryModel") !== "UNLIMITED"}
      >
        <FormLabel>Initial supply</FormLabel>
        <Controller
          control={control}
          name="initialSupply"
          rules={{
            required:
              getValues("inflationaryModel") !== "UNLIMITED" &&
              "This field is required!",
            min: {
              value: 0,
              message: "Must be positive",
            },
            max: {
              value: maxSupply,
              message: "Must be less than max supply",
            },
          }}
          defaultValue={0}
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <NumberInput
              ref={ref}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              min={0}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
        />
        <FormErrorMessage>{errors?.initialSupply?.message}</FormErrorMessage>
      </FormControl>

      <FormControl
        minW={0}
        isInvalid={!!errors?.maxSupply}
        isRequired={getValues("inflationaryModel") !== "UNLIMITED"}
      >
        <FormLabel>Max supply</FormLabel>
        <Controller
          control={control}
          name="maxSupply"
          rules={{
            required:
              getValues("inflationaryModel") !== "UNLIMITED" &&
              "This field is required!",
            min: {
              value: initialSupply,
              message: "Must be greater than initial supply",
            },
          }}
          defaultValue={0}
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <NumberInput
              ref={ref}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              min={0}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
        />
        <FormErrorMessage>{errors?.maxSupply?.message}</FormErrorMessage>
      </FormControl>
    </SimpleGrid>
  )
}

export default MaxSupplyForm
