using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TmsApi.Data;

#nullable disable

namespace TmsApi.Migrations
{
    [DbContext(typeof(TmsDbContext))]
    partial class TmsDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "8.0.0");

            modelBuilder.Entity("TmsApi.Models.User", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd();
                b.Property<string>("Uid").IsRequired();
                b.Property<string>("Password").IsRequired();
                b.Property<string>("Name").IsRequired();
                b.Property<string>("Email").IsRequired();
                b.HasKey("Id");
                b.ToTable("Users");
                b.HasData(new { Id = 1, Uid = "admin", Password = "admin123", Name = "Administrator", Email = "admin@tms.com" });
            });

            modelBuilder.Entity("TmsApi.Models.TimesheetEntry", b =>
            {
                b.Property<int>("Id").ValueGeneratedOnAdd();
                b.Property<int>("UserId");
                b.Property<string>("Date").IsRequired();
                b.Property<string>("Project").IsRequired();
                b.Property<string>("Task").IsRequired();
                b.Property<string>("Hours").IsRequired();
                b.Property<string>("Description").IsRequired();
                b.Property<DateTime>("CreatedAt");
                b.HasKey("Id");
                b.HasIndex("UserId");
                b.ToTable("TimesheetEntries");
            });

            modelBuilder.Entity("TmsApi.Models.TimesheetEntry", b =>
            {
                b.HasOne("TmsApi.Models.User", "User")
                    .WithMany("TimesheetEntries")
                    .HasForeignKey("UserId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();
            });
        }
    }
}
