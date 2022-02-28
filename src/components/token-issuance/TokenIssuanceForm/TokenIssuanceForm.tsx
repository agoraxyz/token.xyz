import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Tooltip,
} from "@chakra-ui/react"
import { useTimeline } from "components/common/Timeline/components/TimelineContext"
import FormSection from "components/forms/FormSection"
import { ImageSquare, Question } from "phosphor-react"
import { useEffect } from "react"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { TokenIssuanceFormType } from "types"
import shortenHex from "utils/shortenHex"
import slugify from "utils/slugify"
import { useAccount } from "wagmi"
import InflationaryModelPicker from "./components/InflationaryModelPicker"

const TokenIssuanceForm = (): JSX.Element => {
  const [{ data: accountData }] = useAccount()

  const { next } = useTimeline()

  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<TokenIssuanceFormType>()

  useEffect(() => {
    if (!register) return
    register("decimals")
  }, [register])

  const tokenName = useWatch({ control, name: "tokenName" })
  const decimals = useWatch({ control, name: "decimals" })

  useEffect(() => {
    if (touchedFields.urlName) return
    setValue("urlName", slugify(tokenName || ""))
  }, [tokenName])

  const isNextButtonDisabled = () =>
    !getValues("tokenName") ||
    !getValues("tokenTicker") ||
    !!errors.tokenName ||
    !!errors.tokenTicker ||
    !!errors.initialSupply ||
    !!errors.maxSupply

  return (
    <Stack spacing={8}>
      <FormSection title="General data">
        <SimpleGrid w="full" gridTemplateColumns="3rem 2fr 1fr" gap={4}>
          <IconButton
            autoFocus
            aria-label="Upload image"
            icon={<Icon as={ImageSquare} />}
            rounded="full"
            boxSize={12}
            flexShrink={0}
            colorScheme="gray"
            variant="outline"
            borderWidth={1}
            bg="blackAlpha.300"
            // onClick={onOpen}
          />
          <FormControl isInvalid={!!errors?.tokenName}>
            <Input
              size="lg"
              {...register("tokenName", { required: "This field is required!" })}
              placeholder="Token name"
            />
            <FormErrorMessage>{errors?.tokenName?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors?.tokenTicker}>
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

        <FormControl isInvalid={!!errors?.urlName}>
          <Input
            size="lg"
            {...register("urlName", {
              required: "This field is required!",
              pattern: {
                value: /^[0-9a-z-]*$/,
                message:
                  "URL name can only contain lowercase letters, numbers, and hyphen",
              },
            })}
            placeholder="URL name"
          />
          <FormErrorMessage>{errors?.urlName?.message}</FormErrorMessage>
        </FormControl>
      </FormSection>

      <FormSection title="Inflationary model">
        <InflationaryModelPicker />
      </FormSection>

      <FormSection title="Chain">
        <Controller
          control={control}
          name="chain"
          defaultValue="GOERLI"
          render={({ field: { ref, value, onChange, onBlur } }) => (
            <Select
              ref={ref}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              size="lg"
              maxW="48"
            >
              <option value="GOERLI">Görli</option>
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

      <Accordion allowToggle>
        <AccordionItem border="none">
          <AccordionButton mb={4} p={0} _hover={{ bgColor: null }}>
            <Box pr={2} textAlign="left" fontWeight="bold">
              Advanced settings
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0} pt={4} borderTopWidth={1}>
            <Stack spacing={8}>
              <FormControl isInvalid={!!errors?.transferOwnershipTo}>
                <FormLabel>Transfer ownership</FormLabel>
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
                <FormErrorMessage>
                  {errors?.transferOwnershipTo?.message}
                </FormErrorMessage>
              </FormControl>

              <SimpleGrid gridTemplateColumns="repeat(2, 1fr)" gap={4}>
                <FormControl isInvalid={!!errors?.mintable}>
                  <FormLabel>Mintable</FormLabel>
                  <Switch
                    {...register("mintable")}
                    variant="strong"
                    colorScheme="cyan"
                  />
                  <FormErrorMessage>{errors?.mintable?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors?.multiOwner}>
                  <FormLabel>Multiple owners</FormLabel>
                  <Switch
                    {...register("multiOwner")}
                    variant="strong"
                    colorScheme="cyan"
                  />
                  <FormErrorMessage>{errors?.multiOwner?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors?.canPause}>
                  <FormLabel>Can pause</FormLabel>
                  <Switch
                    {...register("canPause")}
                    variant="strong"
                    colorScheme="cyan"
                  />
                  <FormErrorMessage>{errors?.canPause?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors?.enableBlacklists}>
                  <FormLabel>Enable blacklists</FormLabel>
                  <Switch
                    {...register("enableBlacklists")}
                    variant="strong"
                    colorScheme="cyan"
                  />
                  <FormErrorMessage>
                    {errors?.enableBlacklists?.message}
                  </FormErrorMessage>
                </FormControl>
              </SimpleGrid>

              <FormControl
                maxW={{ base: "full", md: "50%" }}
                pr={{ base: 2, md: 8 }}
                pb={4}
              >
                <FormLabel>Decimals</FormLabel>
                <Slider
                  defaultValue={18}
                  min={0}
                  max={18}
                  onChange={(value) => setValue("decimals", value)}
                >
                  <SliderMark
                    value={typeof decimals === "number" ? decimals : 18}
                    textAlign="center"
                    bg="primary.500"
                    color="white"
                    mt={4}
                    ml={-4}
                    w={8}
                    rounded="full"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {typeof decimals === "number" ? decimals : 18}
                  </SliderMark>
                  <SliderTrack bg="gray">
                    <Box position="relative" right={10} />
                    <SliderFilledTrack bg="primary.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={5} ml={-2.5} />
                </Slider>
              </FormControl>
            </Stack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      <Flex mt="auto" width="100%" justifyContent="end">
        <Button
          onClick={next}
          colorScheme="primary"
          isDisabled={isNextButtonDisabled()}
        >
          Continue to Distribution
        </Button>
      </Flex>
    </Stack>
  )
}

export default TokenIssuanceForm
