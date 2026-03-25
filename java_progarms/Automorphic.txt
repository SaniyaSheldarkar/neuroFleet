class Automorphic {
    public static void main(String[] args) {
        int num = 25;
        int square = num * num;

        if (String.valueOf(square).endsWith(String.valueOf(num)))
            System.out.println("Automorphic Number");
        else
            System.out.println("Not Automorphic");
    }
}
