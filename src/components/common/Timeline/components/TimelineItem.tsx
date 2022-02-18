import {
  Box,
  Circle,
  HStack,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react"
import { PropsWithChildren } from "react"

type Props = {
  active?: boolean
  completed?: boolean
  icon?: JSX.Element
  title: string
}

const TimelineItem = ({
  active,
  completed,
  icon,
  title,
  children,
}: PropsWithChildren<Props>): JSX.Element => {
  const borderColor = useColorModeValue("gray.200", "gray.700")

  return (
    <Stack
      position="relative"
      overflow="hidden"
      minH={12}
      _before={{
        content: "''",
        position: "absolute",
        top: 6,
        left: 2.5,
        width: 1,
        height: "full",
        bgColor: completed ? "primary.500" : borderColor,
      }}
      _last={{
        _before: { display: "none" },
      }}
    >
      <HStack>
        <Circle
          size={6}
          borderWidth={4}
          borderColor={active ? "primary.500" : borderColor}
        >
          {icon}
        </Circle>
        <Text as="span" fontWeight="bold">
          {title}
        </Text>
      </HStack>

      <Box pl={8} pb={6}>
        {children}
      </Box>
    </Stack>
  )
}

export default TimelineItem
