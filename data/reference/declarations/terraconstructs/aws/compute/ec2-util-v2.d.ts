/**
 * NetworkUtils contains helpers to work with network constructs (subnets/ranges)
 */
export declare class NetworkUtils {
    /**
     * Validates an IPv4 address string.
     *
     * @param ipAddress The IPv4 address string to be validated.
     * @returns True if the string is a valid IPv4 address, false otherwise.
     * Validates an IPv4 string
     *
     * returns true of the string contains 4 numbers between 0-255 delimited by
     * a `.` character
     */
    static validIp(ipAddress: string): boolean;
    /**
     * Converts a string representation of an IPv4 address to its corresponding numerical value.
     *
     * Uses the formula:
     * (first octet * 256³) + (second octet * 256²) + (third octet * 256) +
     * (fourth octet)
     *
     * @param  ipAddress the IP address (e.g. 174.66.173.168)
     * @returns the integer value of the IP address (e.g 2923605416)
     */
    static ipToNum(ipAddress: string): number;
    /**
     * Takes number and converts it to IPv4 address string
     *
     * Takes a number (e.g 2923605416) and converts it to an IPv4 address string
     * currently only supports IPv4
     *
     * @param ipNum integer value of the IP address (e.g 2923605416)
     * @returns IPv4 address (e.g. 174.66.173.168)
     */
    static numToIp(ipNum: number): string;
}
/**
 * Exported class from VPC to support subnet filtering
 * and CIDR validation
 */
export declare class CidrBlock {
    /**
     * Calculates the netmask for a given CIDR mask
     *
     * The netmask is a 32-bit binary value used to separate the network portion from the host portion of an IPv4 address.
     * It is calculated based on the CIDR prefix length (the number of bits used to represent the network portion).
     *
     * For example:
     * CidrBlock.calculateNetmask(24) returns '255.255.255.0'
     *
     * @param mask The CIDR prefix length (between 0 and 32) for which to calculate the netmask.
      // Calculate the netmask by performing a bitwise NOT on the result of (2^32 - 2^(32 - mask))
     * @returns The netmask string in IPv4 address format.
     */
    static calculateNetmask(mask: number): string;
    /**
     * Calculates the number IP addresses in a CIDR Mask
     *
     * For example:
     * CidrBlock.calculateNetsize(16) returns 65536
     *
     * @param mask The CIDR prefix length (between 0 and 32) for which to calculate the network size.
     * CidrBlock.calculateNetsize(24) returns 256
     */
    static calculateNetsize(mask: number): number;
    /**
     * IP address in the CIDR block.
     */
    readonly cidr: string;
    readonly mask: number;
    readonly networkSize: number;
    private readonly networkAddress;
    constructor(cidr: string);
    constructor(ipAddress: number, mask: number);
    maxIp(): string;
    minIp(): string;
    minAddress(): number;
    maxAddress(): number;
    nextBlock(): CidrBlock;
    containsCidr(other: CidrBlock): boolean;
    /**
     * Checks if two IPv4 address ranges overlap.
     *
     * @param range1 The first IP address range represented as an array [start, end].
     * @param range2 The second IP address range represented as an array [start, end].
     * @returns True if the two IP address ranges overlap, false otherwise.
     *
     * Note: This method assumes that the start and end addresses are valid IPv4 addresses.
     */
    rangesOverlap(range1: [string, string], range2: [string, string]): boolean;
}
/**
 * Class with helper functions to support
 * Subnet Ipv6 Address Validation
 *
 * This class provides methods for working with IPv6 CIDR blocks, including calculating the minimum and maximum
 * IP addresses in a CIDR block, and checking if two CIDR blocks overlap.
 */
export declare class CidrBlockIpv6 {
    /**
     * Ipv6 CIDR range
     */
    cidr: string;
    /**
     * The CIDR prefix length (number of bits used for the network portion of the address).
     */
    cidrPrefix: number;
    private ipParts;
    private networkBits;
    private networkPart;
    constructor(cidr: string);
    private parseBigIntParts;
    /**
     * @returns Minimum IPv6 address for a provided CIDR
     */
    minIp(): string;
    /**
     * @returns Maximum IPv6 address for a provided CIDR
     */
    maxIp(): string;
    private formatIPv6Part;
    /**
     *
     * @param range1 Ipv6 CIDR range to compare
     * @param range2 Ipv6 CIDR range to compare
     * @returns true if two ranges overlap, false otherwise
     */
    rangesOverlap(range1: string, range2: string): boolean;
    /**
     *
     * @param cidr
     * @returns Range in the from of big int number [start, end]
     */
    private getIPv6Range;
    /**
     * @param ipv6Address
     * @returns Converts given ipv6 address range to big int number
     */
    private ipv6ToNumber;
}
