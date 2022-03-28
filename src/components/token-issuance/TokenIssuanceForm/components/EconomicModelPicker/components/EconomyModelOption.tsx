import {
  Box,
  Button,
  Collapse,
  Flex,
  Heading,
  HStack,
  RadioProps,
  Stack,
  Tag,
  Text,
  useRadio,
} from "@chakra-ui/react"
import { PropsWithChildren } from "react"

type Props = {
  value: string
  title: string
  description?: string
  disabled: boolean | string
} & RadioProps

const EconomyModelOption = ({
  children,
  ...props
}: PropsWithChildren<Props>): JSX.Element => {
  const { getInputProps, getCheckboxProps } = useRadio(props)
  const input = getInputProps()
  const checkbox = getCheckboxProps()
  const { title, description, disabled, isChecked } = props

  if (disabled)
    return (
      <Button
        as="fieldset"
        variant="unstyled"
        w="full"
        h="auto"
        p="0"
        flexDir="column"
        alignItems="strech"
        boxShadow="none !important"
        _active={{ bg: null }}
        _focus={{ bg: null, boxShadow: "none" }}
        disabled
      >
        <Flex as="label" py="4" px="5" alignItems="center">
          <Box whiteSpace="break-spaces" w="full">
            <Heading size="sm" color="tokenxyz.rosybrown.500">
              {title}
              <Tag bgColor="tokenxyz.rosybrown.500" size="sm" ml="3" mt="-1px">
                {disabled}
              </Tag>
            </Heading>
          </Box>
        </Flex>
      </Button>
    )

  return (
    <Button
      as="fieldset"
      variant="unstyled"
      {...checkbox}
      w="full"
      h="full"
      p="0"
      py={1}
      flexDir="column"
      alignItems="strech"
      borderRadius="none"
      _first={{ borderTopRadius: "xl" }}
      _last={{ borderBottomRadius: "xl" }}
      bg={isChecked ? "tokenxyz.rosybrown.100" : null}
      _hover={{
        bg: isChecked ? null : "tokenxyz.rosybrown.100",
      }}
      _active={{ bg: null }}
      _focus={{ bg: null, boxShadow: "none" }}
      boxShadow="none !important"
      color="tokenxyz.rosybrown.500"
    >
      <Flex
        as="label"
        position="relative"
        py={4}
        px={5}
        cursor="pointer"
        alignItems="center"
      >
        <input {...input} />
        <HStack whiteSpace="break-spaces" w="full" justifyContent="space-between">
          <Stack>
            <Heading size="sm">{title}</Heading>
            {description && (
              <Text fontWeight="normal" mt={1} fontSize="sm">
                {description}
              </Text>
            )}
          </Stack>

          {isChecked && (
            <Flex
              alignItems="center"
              justifyContent="center"
              position="relative"
              px={4}
              h={8}
              bgColor="tokenxyz.red.500"
              color="tokenxyz.white"
              fontSize="xs"
              textTransform="uppercase"
              _after={{
                content: "''",
                position: "absolute",
                inset: 1,
                borderWidth: 2,
                borderColor: "tokenxyz.rosybrown.200",
              }}
            >
              Active
            </Flex>
          )}
        </HStack>
      </Flex>
      {children && <Collapse in={isChecked}>{children}</Collapse>}
    </Button>
  )
}

export default EconomyModelOption
