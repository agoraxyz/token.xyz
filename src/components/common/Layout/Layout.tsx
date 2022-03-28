import { Box, Container, Flex, HStack, Icon, IconButton } from "@chakra-ui/react"
import Meta from "components/common/Meta"
import { House } from "phosphor-react"
import { PropsWithChildren } from "react"
import Link from "../Link"
import Account from "./components/Account"
import InfoMenu from "./components/InfoMenu"

type Props = {
  title?: string
  description?: string
  splitBg?: boolean
}

const Layout = ({
  title,
  description,
  splitBg,
  children,
}: PropsWithChildren<Props>): JSX.Element => (
  <>
    {title && <Meta title={title} description={description} />}
    <Box
      bgColor="tokenxyz.rosybrown.200"
      minHeight="100vh"
      color="tokenxyz.black"
      bgGradient={
        splitBg
          ? "linear(to right, var(--chakra-colors-tokenxyz-rosybrown-300) 0%, var(--chakra-colors-tokenxyz-rosybrown-300) 50%, var(--chakra-colors-tokenxyz-rosybrown-200) 50%, var(--chakra-colors-tokenxyz-rosybrown-200) 100%)"
          : undefined
      }
    >
      <Flex w="full" justifyContent="space-between" alignItems="center" p={4} h={20}>
        <Link href="/">
          <IconButton
            aria-label="Back"
            isRound
            position="relative"
            mt={-1}
            boxSize={10}
            minWidth={10}
            minHeight={10}
            colorScheme="tokenxyz.blue"
            icon={<Icon as={House} />}
            fontSize="sm"
            _after={{
              content: "''",
              position: "absolute",
              inset: 1,
              borderRadius: "full",
              borderWidth: 2,
              borderColor: "tokenxyz.rosybrown.200",
            }}
          />
        </Link>

        <HStack spacing="2">
          <Account />
          <InfoMenu />
        </HStack>
      </Flex>

      <Container maxW="container.lg" px={{ base: 4, sm: 6, md: 8, lg: 10 }}>
        {children}
      </Container>
    </Box>
  </>
)

export default Layout
