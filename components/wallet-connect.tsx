"use client"

import { useState, useEffect } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function WalletConnect() {
	const { address, isConnected } = useAccount()
	const { disconnect } = useDisconnect()
	const [mounted, setMounted] = useState(false)
	const [copied, setCopied] = useState(false)
	const [confirmOpen, setConfirmOpen] = useState(false)

	useEffect(() => setMounted(true), [])
	if (!mounted) return null

	const copyAddress = async () => {
		if (address) {
			await navigator.clipboard.writeText(address)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		}
	}

	if (isConnected) {
		return (
			<div className="flex items-center gap-2">
				<Badge variant="outline" className="bg-green-900/20 border-green-700/50 text-green-400">
					<div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
					Connected
				</Badge>
				<div className="flex items-center gap-2 bg-[#1a1d26] border border-[#2a2d36] rounded-lg px-3 py-2">
					<Wallet className="h-4 w-4 text-blue-400" />
					<span className="text-sm text-white font-mono">
						{address?.slice(0, 6)}...{address?.slice(-4)}
					</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={copyAddress}
						className="p-1 h-6 w-6 hover:bg-[#252836]"
					>
						{copied ? (
							<Check className="h-3 w-3 text-green-400" />
						) : (
							<Copy className="h-3 w-3 text-gray-400" />
						)}
					</Button>
					<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
						<AlertDialogTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="p-1 h-6 w-6 hover:bg-[#252836] text-gray-400 hover:text-red-400"
								onClick={() => setConfirmOpen(true)}
							>
								<LogOut className="h-3 w-3" />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Disconnect wallet?</AlertDialogTitle>
								<AlertDialogDescription>
									You can reconnect anytime. This will end your current session.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={() => disconnect()}>Disconnect</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		)
	}

	// Use AppKit's official button component
	return <appkit-button />
}
