import {
  Button,
  Circle,
  Flex,
  FormControl,
  FormErrorMessage,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react"
import FormSection from "components/common/FormSection"
import { useTimeline } from "components/common/Timeline/components/TImelineContext"
import { Question } from "phosphor-react"
import { Controller, useFormContext } from "react-hook-form"
import shortenHex from "utils/shortenHex"
import { useAccount } from "wagmi"

const TokenIssuanceForm = (): JSX.Element => {
  const [{ data: accountData }] = useAccount()

  const { next } = useTimeline()

  const {
    control,
    register,
    getValues,
    formState: { errors },
  } = useFormContext()

  const isNextButtonDisabled = () =>
    !getValues("tokenName") ||
    !getValues("tokenTicker") ||
    !getValues("initialSupply") ||
    errors.tokenName ||
    errors.tokenTicker ||
    errors.initialSupply

  return (
    <Stack spacing={8}>
      <FormSection title="General data">
        <SimpleGrid w="full" gridTemplateColumns="3rem 2fr 1fr" gap={4}>
          <Circle size={12} bgColor="gray.700">
            <Text as="span" color="gray" fontSize="xs">
              img
            </Text>
          </Circle>
          <FormControl isInvalid={errors?.tokenName}>
            <Input
              size="lg"
              {...register("tokenName", { required: "This field is required!" })}
              placeholder="Token name"
            />
            <FormErrorMessage>{errors?.tokenName?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={errors?.tokenTicker}>
            <InputGroup>
              <Input
                size="lg"
                {...register("tokenTicker", { required: "This field is required!" })}
                placeholder="Ticker"
              />
              <InputRightElement h="full" alignItems="center">
                <Tooltip label="A ticker means a short symbol for your token, used by exchanges.">
                  <Icon as={Question} color="gray" boxSize={5} />
                </Tooltip>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors?.tokenTicker?.message}</FormErrorMessage>
          </FormControl>
        </SimpleGrid>

        <FormControl isInvalid={errors?.initialSupply} w="full">
          <Input
            size="lg"
            {...register("initialSupply", { required: "This field is required!" })}
            placeholder="Initial supply"
          />
          <FormErrorMessage>{errors?.initialSupply?.message}</FormErrorMessage>
        </FormControl>
      </FormSection>

      <FormSection title="Transfer ownership">
        <FormControl isInvalid={errors?.transferOwnershipTo}>
          <InputGroup>
            <Input
              size="lg"
              {...register("transferOwnershipTo")}
              placeholder={shortenHex(accountData?.address)}
            />
            <InputRightElement h="full" alignItems="center">
              <Tooltip label="TODO">
                <Icon as={Question} color="gray" boxSize={5} />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors?.transferOwnershipTo?.message}</FormErrorMessage>
        </FormControl>
      </FormSection>

      <FormSection title="Chain">
        <Controller
          control={control}
          name="chain"
          defaultValue="ETHEREUM"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <Select
              ref={ref}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              size="lg"
              maxW="48"
            >
              <option value="ETHEREUM">Ethereum</option>
              <option value="POLYGON" disabled>
                Polygon (soon)
              </option>
              <option value="BSC" disabled>
                BSC (soon)
              </option>
            </Select>
          )}
        />
      </FormSection>

      <Flex mt="auto" width="100%" justifyContent="end">
        <Button
          onClick={next}
          colorScheme="primary"
          isDisabled={isNextButtonDisabled()}
        >
          Continue to Distribution
        </Button>
      </Flex>

      {/* <FormSection title="Inflationary model">
        <FormControl isInvalid={errors?.inflationaryModel}>
          <InflationaryModelPicker />
          <FormErrorMessage>{errors?.inflationaryModel?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={errors?.maxSupply} w="full">
          <InputGroup>
            <Input
              size="lg"
              {...register("maxSupply", { required: "This field is required!" })}
              placeholder="Max supply"
            />
            <InputRightElement>
              <Tooltip label="Fully diluted token supply">
                <Icon as={Question} color="gray" />
              </Tooltip>
            </InputRightElement>
          </InputGroup>
          <FormErrorMessage>{errors?.maxSupply?.message}</FormErrorMessage>
        </FormControl>
      </FormSection> */}
    </Stack>
  )
}

export default TokenIssuanceForm
